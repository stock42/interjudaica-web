/**
 * PII redaction layer for LLM context.
 *
 * Strips sensitive data (emails, passwords, tokens, verification codes, IPs)
 * before sending context to DeepSeek. Synchronous, pure regex — no network
 * calls, no async, no DB access.
 *
 * Used by the chat endpoint (Task 18) and any future LLM-calling code.
 */

// ---------------------------------------------------------------------------
// Regex patterns for known PII shapes in text
// ---------------------------------------------------------------------------

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const IP_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g
const SESSION_TOKEN_PATTERN = /\b[a-f0-9]{64}\b/g

// ---------------------------------------------------------------------------
// Known sensitive field names (User + Operator schemas + generic secrets)
// ---------------------------------------------------------------------------

const SENSITIVE_FIELDS = new Set([
	// User schema (models/users.ts)
	'password',
	'passwordHash',
	'emailVerificationCode',
	'emailVerificationExpiresAt',
	'emailVerifiedAt',
	'passwordResetCode',
	'passwordResetExpiresAt',
	'passwordResetAttempts',
	'passwordResetAttemptsWindowStart',
	'passwordResetLockedUntil',
	'passwordChangedAt',
	'loginAttempts',
	'loginLockedUntil',

	// Operator schema (models/operators.ts)
	'verifyCode',

	// Generic / future-proof
	'verificationCode',
	'resetCode',
	'secret',
	'apiKey',
	'token',
	'accessToken',
	'refreshToken',
	'sessionToken',
	'authSecret',
])

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Redact PII from a plain-text string.
 *
 * Replaces:
 *  - Email addresses → `[EMAIL]`
 *  - IPv4 addresses   → `[IP]`
 *  - JWT tokens       → `[TOKEN]`
 *  - 64-char hex session tokens → `[TOKEN]`
 */
export function redactPii(text: string): string {
	return text
		.replace(EMAIL_PATTERN, '[EMAIL]')
		.replace(IP_PATTERN, '[IP]')
		.replace(JWT_PATTERN, '[TOKEN]')
		.replace(SESSION_TOKEN_PATTERN, '[TOKEN]')
}

/**
 * Sanitize a full LLM context string: redact PII + truncate to a maximum
 * approximate token count (4 chars ≈ 1 token).
 *
 * @param context  Raw context string to sanitize.
 * @param maxTokens  Maximum approximate tokens (default 8000).
 * @returns Sanitized, potentially truncated string.
 */
export function sanitizeContext(context: string, maxTokens = 8000): string {
	const redacted = redactPii(context)
	const maxChars = maxTokens * 4
	if (redacted.length > maxChars) {
		return redacted.slice(0, maxChars) + '...[truncated]'
	}
	return redacted
}

/**
 * Filter a tool result object so that sensitive fields are replaced with
 * `[REDACTED]` before the data enters LLM context.
 *
 * Handles:
 *  - Single objects   → field-level filtering
 *  - Arrays of objects → each element filtered
 *  - Nested objects    → recursive filtering
 *  - null / undefined / primitives → passed through unchanged
 *
 * @param toolName  The tool name (unused currently, reserved for future
 *                  per-tool customisation).
 * @param result    The raw tool result to filter.
 * @returns Filtered result of the same shape.
 */
export function filterToolResult(toolName: string, result: unknown): unknown {
	if (result === null || result === undefined) return result
	if (Array.isArray(result)) {
		return result.map((item) => filterToolResult(toolName, item))
	}
	if (typeof result === 'object') {
		return filterSensitiveFields(result as Record<string, unknown>)
	}
	return result
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function filterSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
	const filtered: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(obj)) {
		if (SENSITIVE_FIELDS.has(key)) {
			filtered[key] = '[REDACTED]'
		} else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			filtered[key] = filterSensitiveFields(value as Record<string, unknown>)
		} else if (Array.isArray(value)) {
			filtered[key] = value.map((item) =>
				item !== null && typeof item === 'object' && !Array.isArray(item)
					? filterSensitiveFields(item as Record<string, unknown>)
					: item,
			)
		} else {
			filtered[key] = value
		}
	}
	return filtered
}

/**
 * Type guard: check whether a value is a plain object (not null, not array).
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}
