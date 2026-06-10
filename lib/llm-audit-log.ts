import 'server-only'

import { AgentAuditStorage } from '@/services/agent-audit-storage'
import { filterToolResult } from '@/lib/llm-pii-guard'

const MAX_LENGTH = 500

/**
 * Audits a tool call by sanitizing parameters and result, truncating to 500
 * characters each, and persisting a log entry via AgentAuditStorage.
 *
 * Designed to be called from the LLM tool-execution loop — never blocks or
 * throws into the caller.
 */
export async function auditToolCall(
	user: { uuid: string; email?: string },
	toolName: string,
	params: unknown,
	result: unknown,
	duration: number,
	success: boolean,
	error?: string,
): Promise<void> {
	try {
		const sanitizedParams = sanitizeAndTruncate(toolName, params)
		const sanitizedResult = sanitizeAndTruncate(toolName, result)

		await AgentAuditStorage.logExecution({
			timestamp: new Date().toISOString(),
			userUuid: user.uuid,
			userEmail: user.email || '',
			toolName,
			parameters: sanitizedParams,
			result: sanitizedResult,
			duration,
			success,
			error: error || '',
		})
	} catch {
		// Auditing is best-effort — never propagate errors to the caller
	}
}

function sanitizeAndTruncate(toolName: string, value: unknown): string {
	if (value === null || value === undefined) return ''

	let raw: string
	if (typeof value === 'object') {
		const filtered = filterToolResult(toolName, value)
		raw = JSON.stringify(filtered)
	} else {
		raw = String(value)
	}

	return raw.slice(0, MAX_LENGTH)
}
