import 'server-only'

import {
	streamText,
	convertToModelMessages,
	createUIMessageStreamResponse,
	stepCountIs,
} from 'ai'
import type { ToolSet } from 'ai'

import { deepseekProvider } from '@/lib/ai-provider'
import { redactPii, filterToolResult } from '@/lib/llm-pii-guard'
import { authorizeTool } from '@/lib/llm-tool-auth'
import { auditToolCall } from '@/lib/llm-audit-log'
import { ChatStorage } from '@/services/chat-storage'
import { checkChatRateLimit } from '@/lib/llm-rate-limiter'
import { getCurrentOperator } from '@/services/auth'
import { getCurrentUser } from '@/services/user-auth'
import { createUuid } from '@/models/model-utils'

import { ADMIN_SYSTEM_PROMPT, STUDENT_SYSTEM_PROMPT } from './system-prompt'

// Side-effects: imports all tool files so registerTool() calls fire and
// the TOOL_AUTH_MAP is populated. Also gives us the tool definitions.
import * as toolDefs from './tools'

export const runtime = 'nodejs'

// ── POST ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
	// 1. Auth: try operator first, then student
	const operator = await getCurrentOperator()
	const user = await getCurrentUser()

	if (!operator && !user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const role = operator ? 'operator' : 'student'
	const authUser = operator ?? user!

	const rateKey = authUser.email || authUser.uuid
	const { allowed, retryAfter } = await checkChatRateLimit(role, rateKey)
	if (!allowed) {
		return Response.json(
			{ error: 'Rate limit exceeded', retryAfter },
			{ status: 429 },
		)
	}

	// 2. Parse request body
	let body: { messages?: unknown[]; threadUuid?: string }
	try {
		body = await req.json()
	} catch {
		return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
	}

	const incomingMessages = Array.isArray(body.messages) ? body.messages : []

	// 3. Load or create thread
	let threadUuid = body.threadUuid

	if (threadUuid) {
		const existing = await ChatStorage.getThread(threadUuid)
		if (!existing) {
			return Response.json(
				{ error: 'Thread not found' },
				{ status: 404 },
			)
		}
		// Security: verify the thread belongs to this user
		if (existing.userUuid !== authUser.uuid) {
			return Response.json({ error: 'Forbidden' }, { status: 403 })
		}
	} else {
		const thread = await ChatStorage.createThread(authUser.uuid)
		threadUuid = thread.uuid
	}

	// 4. Load recent chat history
	const recentMessages = await ChatStorage.getRecentMessages(threadUuid, 20)

	// 5. Build system prompt based on role
	const systemPrompt =
		role === 'operator' ? ADMIN_SYSTEM_PROMPT : STUDENT_SYSTEM_PROMPT

	// 6. Build filtered tools object (role-based authorization)
	const tools: ToolSet = {}
	const userCtx = { role }

	for (const [name, toolDef] of Object.entries(toolDefs)) {
		const auth = authorizeTool(name, userCtx)
		if (auth.allowed) {
			tools[name] = toolDef as ToolSet[string]
		}
	}

	// 7. Convert and sanitize messages
	//    a) History messages: sanitize content with redactPii
	const historyMsgs = recentMessages.map((m) => ({
		role: m.role as 'user' | 'assistant' | 'tool',
		content: redactPii(m.content),
	}))

	//    b) Incoming UI messages: convert to model format, then sanitize
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const modelMsgs = await convertToModelMessages(incomingMessages as any[])
	const sanitizedModelMsgs = modelMsgs.map((m) => ({
		...m,
		content:
			typeof m.content === 'string'
				? redactPii(m.content)
				: m.content,
	}))

	// 8. Persist incoming user messages before streaming
	const now = new Date().toISOString()
	const maxContentLen = 10240

	for (const m of sanitizedModelMsgs) {
		if (m.role === 'user') {
			const raw = typeof m.content === 'string' ? m.content : ''
			if (raw) {
				ChatStorage.addMessage({
					uuid: createUuid(),
					threadUuid,
					role: 'user',
					content:
						raw.length > maxContentLen
							? raw.slice(0, maxContentLen)
							: raw,
					createdAt: now,
				}).catch(() => {})
			}
		}
	}

	// 9. Build the full message array for the LLM
	const allMessages: Array<{ role: string; content: unknown }> = [
		...historyMsgs,
		...sanitizedModelMsgs,
	]

	// Extract email from auth user (both operator and user types have it)
	const authEmail: string | undefined =
		'email' in authUser ? (authUser as { email: string }).email : undefined

	const result = streamText({
		model: deepseekProvider,
		system: systemPrompt,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		messages: allMessages as any,
		tools,
		stopWhen: stepCountIs(10),
		maxOutputTokens: 8192,
		abortSignal: req.signal,
		onStepFinish: async ({ toolCalls, toolResults }) => {
			// Audit each tool call (fire-and-forget, never blocks the stream)
			for (const call of toolCalls) {
				const tr = toolResults.find(
					(r) => r.toolCallId === call.toolCallId,
				)
				// DynamicToolCall has `input` and optional `error`
				const callInput = (call as { input: unknown }).input
				const callError = (call as { error?: unknown }).error
				const trOutput = tr
					? (tr as { output: unknown }).output
					: undefined

				auditToolCall(
					{ uuid: authUser.uuid, email: authEmail },
					call.toolName,
					callInput,
					trOutput,
					0,
					!callError && tr !== undefined,
					callError ? String(callError) : undefined,
				).catch(() => {})
			}
		},
		onFinish: async ({ text, steps }) => {
			const finishTime = new Date().toISOString()

			// Save assistant message
			if (text) {
				await ChatStorage.addMessage({
					uuid: createUuid(),
					threadUuid,
					role: 'assistant',
					content:
						text.length > maxContentLen
							? text.slice(0, maxContentLen)
							: text,
					createdAt: finishTime,
				}).catch(() => {})
			}

			// Save tool messages from all steps
			for (const step of steps ?? []) {
				for (const tr of step.toolResults ?? []) {
					const toolOutput = (tr as { output: unknown }).output
					const filtered = filterToolResult(tr.toolName, toolOutput)
					const content =
						typeof filtered === 'string'
							? filtered
							: JSON.stringify(filtered)

					await ChatStorage.addMessage({
						uuid: createUuid(),
						threadUuid,
						role: 'tool',
						content:
							content.length > maxContentLen
								? content.slice(0, maxContentLen)
								: content,
						createdAt: finishTime,
					}).catch(() => {})
				}
			}
		},
	})

	// 10. Return SSE stream via the result's built-in UI message stream
	return createUIMessageStreamResponse({
		stream: result.toUIMessageStream(),
		headers: {
			'X-Thread-Uuid': threadUuid,
		},
	})
}
