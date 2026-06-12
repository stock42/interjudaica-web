import 'server-only'

import {
	streamText,
	convertToModelMessages,
	createUIMessageStreamResponse,
	stepCountIs,
	tool,
} from 'ai'
import type { ToolSet } from 'ai'
import { z } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'

import { deepseekProvider } from '@/lib/ai-provider'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'
import { BookStorage } from '@/services/books-storage'
import { ChatStorage } from '@/services/chat-storage'
import { createUuid } from '@/models/model-utils'

export const runtime = 'nodejs'

const TODAY = new Date().toISOString().slice(0, 10)

function buildSystemPrompt(book: {
	uuid: string
	title: string
	slug: string
	status: string
	price: number
	description: string
	longDescription: string
}) {
	return `You are the InterJudaica Book AI Development Assistant. InterJudaica is an English-language online platform for Jewish courses, community membership, academic papers, forum discussions, and digital books. The target audience is in the United States. All prices are in USD.

Today's date is ${TODAY}.

You are assisting a platform operator who is developing the book "${book.title}" (slug: ${book.slug}).
Book UUID: ${book.uuid}
Current status: ${book.status}
Price: $${(book.price / 100).toFixed(2)} USD
Short description: ${book.description}

Full book content (longDescription):
${book.longDescription || '(No content yet — the book is empty and ready to be written)'}

Your role:
- Help the operator develop, refine, and expand this book's content.
- Use the updateBookContent tool to save changes to the book's content.
- Use the generateBookChapter tool when the operator asks you to generate a new chapter.
- Suggest improvements, catch inconsistencies, and help structure the book logically.
- Write in a scholarly yet accessible style suitable for an English-language Jewish studies audience.
- Use markdown formatting for chapter content (headings, paragraphs, blockquotes, lists).
- Keep responses concise and professional.
- Never invent or guess data — if you don't know, say so.
- Never expose passwords, verification codes, API keys, tokens, or sensitive personal information.
- If a tool fails or returns an error, report it clearly to the operator.`
}

// ── Book-specific tools ──

const updateBookTool = tool({
	description:
		"Update the content (longDescription) of this book. Use this to save refined, expanded, or restructured content. The longDescription holds the book's full text content including all chapters.",
	inputSchema: z.object({
		longDescription: z
			.string()
			.min(1)
			.max(10000)
			.describe("The book's new full content including all updated chapters"),
	}),
})

const generateChapterTool = tool({
	description:
		'Request chapter generation for this book. Returns structured context so you can generate the chapter content in your response. After generating, present the chapter to the operator and offer to save it via updateBookContent.',
	inputSchema: z.object({
		chapterTitle: z
			.string()
			.min(1)
			.max(200)
			.describe('Title of the chapter to generate'),
		chapterDescription: z
			.string()
			.min(1)
			.max(2000)
			.describe('What the chapter should cover — topics, themes, approach'),
		approximateWordCount: z
			.number()
			.int()
			.min(100)
			.max(5000)
			.default(800)
			.describe('Approximate word count for the chapter'),
	}),
})

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	const { uuid: bookUuid } = await params

	let body: { messages?: unknown[]; threadUuid?: string }
	try {
		body = await readJson(request)
	} catch {
		return NextResponse.json(
			{ error: 'Invalid JSON body' },
			{ status: 400 },
		)
	}

	try {
		// Load the book
		const bookData = await BookStorage.get(bookUuid)
		if (!bookData?.uuid) {
			return NextResponse.json(
				{ error: 'Book not found' },
				{ status: 404 },
			)
		}
		const book = bookData as typeof bookData & { uuid: string; slug: string }

		const incomingMessages = Array.isArray(body.messages)
			? body.messages
			: []

		// Load or create thread
		let threadUuid = body.threadUuid
		if (threadUuid) {
			const existing = await ChatStorage.getThread(threadUuid)
			if (!existing) {
				return NextResponse.json(
					{ error: 'Thread not found' },
					{ status: 404 },
				)
			}
		} else {
			const thread = await ChatStorage.createThread(auth.operator.uuid)
			threadUuid = thread.uuid
		}

		// Load recent chat history
		const recentMessages = threadUuid
			? await ChatStorage.getRecentMessages(threadUuid, 20)
			: []

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const modelMsgs = await convertToModelMessages(incomingMessages as any[])

		// Persist incoming user messages
		const now = new Date().toISOString()
		const maxContentLen = 10240
		for (const m of modelMsgs) {
			if (m.role === 'user') {
				const raw =
					typeof m.content === 'string' ? m.content : ''
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

		// Build the full message array (history + new)
		const historyMsgs = recentMessages.map((m) => ({
			role: m.role as 'user' | 'assistant' | 'tool',
			content: m.content,
		}))

		const allMessages = [...historyMsgs, ...modelMsgs]

		// Build tools
		const tools: ToolSet = {
			updateBookContent: updateBookTool.execute
				? {
						description: updateBookTool.description,
						inputSchema: updateBookTool.inputSchema,
						execute: async (input: { longDescription: string }) => {
							const updated = await BookStorage.update(bookUuid, {
								longDescription: input.longDescription,
							})
							if (!updated)
								throw new Error(
									`Failed to update book: ${bookUuid}`,
								)
							return {
								success: true,
								bookTitle: updated.title,
								uuid: updated.uuid,
							}
						},
					}
				: updateBookTool,
			generateBookChapter: generateChapterTool.execute
				? {
						description: generateChapterTool.description,
						inputSchema: generateChapterTool.inputSchema,
						execute: async (input: {
							chapterTitle: string
							chapterDescription: string
							approximateWordCount?: number
						}) => {
							return {
								success: true,
								book: {
									uuid: book.uuid,
									title: book.title,
									slug: book.slug,
								},
								chapterRequest: {
									chapterTitle: input.chapterTitle,
									chapterDescription:
										input.chapterDescription,
									approximateWordCount:
										input.approximateWordCount || 800,
								},
								instruction:
									'Use the full book context from the system prompt to generate this chapter. Write in a scholarly yet accessible style suitable for an English-language Jewish studies audience. Format the chapter with markdown headings, paragraphs, and blockquotes where appropriate. After generating, present the chapter to the operator and offer to save it via updateBookContent.',
							}
						},
					}
				: generateChapterTool,
		}

		// Stream the response
		const result = streamText({
			model: deepseekProvider,
			system: buildSystemPrompt(book),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			messages: allMessages as any,
			tools,
			stopWhen: stepCountIs(10),
			maxOutputTokens: 8192,
			abortSignal: request.signal,
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

				// Save tool messages
				for (const step of steps ?? []) {
					for (const tr of step.toolResults ?? []) {
						const toolOutput = (
							tr as { output: unknown }
						).output
						const content =
							typeof toolOutput === 'string'
								? toolOutput
								: JSON.stringify(toolOutput)

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

		return createUIMessageStreamResponse({
			stream: result.toUIMessageStream(),
			headers: {
				'X-Thread-Uuid': threadUuid,
			},
		})
	} catch (error) {
		return routeError(error, {
			event: 'book_ai_chat_error',
			route: `/api/admin/books/${bookUuid}/ai-assistant/chat`,
			method: 'POST',
		})
	}
}
