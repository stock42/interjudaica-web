import { describe, expect, test } from 'bun:test'
import {
	redactPii,
	sanitizeContext,
	filterToolResult,
	isPlainObject,
} from '@/lib/llm-pii-guard'

// ---------------------------------------------------------------------------
// redactPii — text-level PII replacement
// ---------------------------------------------------------------------------

describe('redactPii', () => {
	test('redacts a single email', () => {
		expect(redactPii('Contact john@example.com')).toBe('Contact [EMAIL]')
	})

	test('redacts multiple emails', () => {
		const input = 'a@b.com and x@y.co.uk, plus admin@interjudaica.com'
		expect(redactPii(input)).toBe('[EMAIL] and [EMAIL], plus [EMAIL]')
	})

	test('redacts email surrounded by text', () => {
		expect(redactPii('Reply to: help@example.com for questions')).toBe(
			'Reply to: [EMAIL] for questions',
		)
	})

	test('redacts IPv4 address', () => {
		expect(redactPii('Server at 192.168.1.1 responded')).toBe(
			'Server at [IP] responded',
		)
	})

	test('redacts multiple IPs', () => {
		expect(redactPii('10.0.0.1 -> 10.0.0.2')).toBe('[IP] -> [IP]')
	})

	test('redacts JWT token', () => {
		const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
		expect(redactPii(`Bearer ${jwt}`)).toBe('Bearer [TOKEN]')
	})

	test('redacts 64-char hex session token', () => {
		const hexToken = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
		expect(redactPii(`session=${hexToken}`)).toBe('session=[TOKEN]')
	})

	test('does not modify text without PII', () => {
		const input = 'The course starts on Monday at 10:00 AM EST.'
		expect(redactPii(input)).toBe(input)
	})

	test('handles mixed PII types', () => {
		const input =
			'User: alice@example.com, IP: 203.0.113.42, token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36'
		expect(redactPii(input)).toBe('User: [EMAIL], IP: [IP], token: [TOKEN]')
	})

	test('handles empty string', () => {
		expect(redactPii('')).toBe('')
	})

	test('handles string with only PII tokens', () => {
		expect(redactPii('john@doe.com')).toBe('[EMAIL]')
	})
})

// ---------------------------------------------------------------------------
// sanitizeContext — redact + truncate
// ---------------------------------------------------------------------------

describe('sanitizeContext', () => {
	test('redacts PII in context string', () => {
		const ctx = 'Login as admin@site.com from 10.0.0.5'
		expect(sanitizeContext(ctx)).toBe('Login as [EMAIL] from [IP]')
	})

	test('truncates long context to maxTokens', () => {
		// 1000 tokens * 4 chars = 4000 chars, so create 5000 chars of text
		const longText = 'x'.repeat(5000)
		const result = sanitizeContext(longText, 1000)
		expect(result.endsWith('...[truncated]')).toBe(true)
		expect(result.length).toBe(4000 + '...[truncated]'.length)
	})

	test('does not truncate short context', () => {
		const shortText = 'Hello world'
		expect(sanitizeContext(shortText)).toBe('Hello world')
	})

	test('does not append truncation marker when exact length', () => {
		const exactText = 'x'.repeat(8000 * 4)
		const result = sanitizeContext(exactText, 8000)
		expect(result.endsWith('...[truncated]')).toBe(false)
	})

	test('default maxTokens is 8000', () => {
		const longText = 'x'.repeat(8000 * 4 + 1)
		const result = sanitizeContext(longText)
		expect(result.endsWith('...[truncated]')).toBe(true)
		expect(result.length).toBe(8000 * 4 + '...[truncated]'.length)
	})
})

// ---------------------------------------------------------------------------
// filterToolResult — field-level stripping from objects
// ---------------------------------------------------------------------------

describe('filterToolResult', () => {
	test('strips password field from a single object', () => {
		const input = { email: 'x@y.com', password: 'abc123hash' }
		const result = filterToolResult('listUsers', input)
		expect(result).toEqual({ email: 'x@y.com', password: '[REDACTED]' })
	})

	test('leaves non-sensitive fields intact', () => {
		const input = { uuid: 'abc', email: 'x@y.com', firstName: 'Jane' }
		const result = filterToolResult('listUsers', input)
		expect(result).toEqual(input)
	})

	test('strips password fields from array of objects', () => {
		const input = [
			{ email: 'a@b.com', password: 'h1' },
			{ email: 'c@d.com', password: 'h2' },
		]
		const result = filterToolResult('listUsers', input)
		expect(result).toEqual([
			{ email: 'a@b.com', password: '[REDACTED]' },
			{ email: 'c@d.com', password: '[REDACTED]' },
		])
	})

	test('strips nested sensitive fields recursively', () => {
		const input = {
			user: {
				email: 'x@y.com',
				password: 'secret123',
				profile: {
					secret: 'should-be-redacted',
					bio: 'A short bio',
				},
			},
		}
		const result = filterToolResult('getUser', input)
		expect(result).toEqual({
			user: {
				email: 'x@y.com',
				password: '[REDACTED]',
				profile: {
					secret: '[REDACTED]',
					bio: 'A short bio',
				},
			},
		})
	})

	test('strips all User-model sensitive fields', () => {
		const input = {
			email: 'student@example.com',
			password: 'hash123',
			emailVerificationCode: '123456',
			emailVerificationExpiresAt: '2026-01-01',
			emailVerifiedAt: '2026-01-01',
			passwordResetCode: '654321',
			passwordResetExpiresAt: '2026-01-02',
			passwordResetAttempts: 3,
			passwordResetAttemptsWindowStart: '2026-01-01',
			passwordResetLockedUntil: '2026-01-03',
			passwordChangedAt: '2026-01-01',
			loginAttempts: 5,
			loginLockedUntil: '2026-01-03',
			firstName: 'Alice',
		}
		const result = filterToolResult('getUser', input)
		expect(result).toEqual({
			email: 'student@example.com',
			password: '[REDACTED]',
			emailVerificationCode: '[REDACTED]',
			emailVerificationExpiresAt: '[REDACTED]',
			emailVerifiedAt: '[REDACTED]',
			passwordResetCode: '[REDACTED]',
			passwordResetExpiresAt: '[REDACTED]',
			passwordResetAttempts: '[REDACTED]',
			passwordResetAttemptsWindowStart: '[REDACTED]',
			passwordResetLockedUntil: '[REDACTED]',
			passwordChangedAt: '[REDACTED]',
			loginAttempts: '[REDACTED]',
			loginLockedUntil: '[REDACTED]',
			firstName: 'Alice',
		})
	})

	test('strips Operator-model sensitive fields', () => {
		const input = {
			email: 'operator@example.com',
			password: 'op-hash',
			verifyCode: '789012',
			loginAttempts: 2,
			loginLockedUntil: '2026-01-02',
			passwordChangedAt: '2026-01-01',
			firstName: 'Bob',
			enabled: true,
		}
		const result = filterToolResult('getOperator', input)
		expect(result).toEqual({
			email: 'operator@example.com',
			password: '[REDACTED]',
			verifyCode: '[REDACTED]',
			loginAttempts: '[REDACTED]',
			loginLockedUntil: '[REDACTED]',
			passwordChangedAt: '[REDACTED]',
			firstName: 'Bob',
			enabled: true,
		})
	})

	test('strips apiKey, token, and secret fields', () => {
		const input = {
			apiKey: 'sk-12345',
			token: 'abcdef',
			accessToken: 'ghijkl',
			refreshToken: 'mnopqr',
			sessionToken: 'stuvwx',
			authSecret: 'yz1234',
			safeField: 'visible',
		}
		const result = filterToolResult('someTool', input)
		expect(result).toEqual({
			apiKey: '[REDACTED]',
			token: '[REDACTED]',
			accessToken: '[REDACTED]',
			refreshToken: '[REDACTED]',
			sessionToken: '[REDACTED]',
			authSecret: '[REDACTED]',
			safeField: 'visible',
		})
	})

	test('handles null result', () => {
		expect(filterToolResult('any', null)).toBe(null)
	})

	test('handles undefined result', () => {
		expect(filterToolResult('any', undefined)).toBe(undefined)
	})

	test('handles primitive result (number)', () => {
		expect(filterToolResult('any', 42)).toBe(42)
	})

	test('handles primitive result (string)', () => {
		expect(filterToolResult('any', 'hello world')).toBe('hello world')
	})

	test('handles empty array', () => {
		expect(filterToolResult('any', [])).toEqual([])
	})

	test('handles empty object', () => {
		expect(filterToolResult('any', {})).toEqual({})
	})

	test('does not mutate original object', () => {
		const input = { email: 'x@y.com', password: 'secret', name: 'Test' }
		const copy = { ...input }
		filterToolResult('listUsers', input)
		expect(input).toEqual(copy)
	})

	test('handles array with non-object elements', () => {
		expect(filterToolResult('any', [1, 'two', true])).toEqual([1, 'two', true])
	})

	test('handles nested array with objects', () => {
		const input = {
			items: [
				{ password: 'h1', name: 'A' },
				{ password: 'h2', name: 'B' },
			],
		}
		const result = filterToolResult('any', input)
		expect(result).toEqual({
			items: [
				{ password: '[REDACTED]', name: 'A' },
				{ password: '[REDACTED]', name: 'B' },
			],
		})
	})
})

// ---------------------------------------------------------------------------
// isPlainObject — type guard
// ---------------------------------------------------------------------------

describe('isPlainObject', () => {
	test('returns true for plain objects', () => {
		expect(isPlainObject({})).toBe(true)
		expect(isPlainObject({ key: 'value' })).toBe(true)
	})

	test('returns false for null', () => {
		expect(isPlainObject(null)).toBe(false)
	})

	test('returns false for arrays', () => {
		expect(isPlainObject([])).toBe(false)
		expect(isPlainObject([1, 2, 3])).toBe(false)
	})

	test('returns false for primitives', () => {
		expect(isPlainObject('string')).toBe(false)
		expect(isPlainObject(42)).toBe(false)
		expect(isPlainObject(true)).toBe(false)
		expect(isPlainObject(undefined)).toBe(false)
	})
})
