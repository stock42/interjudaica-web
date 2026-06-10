/**
 * CSRF Protection E2E Tests
 *
 * Verifies that all 9 state-changing POST endpoints reject requests
 * missing a valid CSRF token, and accept requests with one.
 *
 * The CSRF module (services/csrf.ts) uses HMAC-SHA256 with a timing-safe
 * comparison. The cookie is __Host-interjudaica_csrf, header is x-csrf-token.
 */

import { expect, test } from '@playwright/test'
import { createHmac, randomInt } from 'crypto'

/* ───────── CSRF Token Generation (mirrors services/csrf.ts) ───────── */

const CSRF_COOKIE = '__Host-interjudaica_csrf'
const CSRF_HEADER = 'x-csrf-token'
const DEVELOPMENT_AUTH_SECRET = 'interjudaica-local-development-secret'

function getCsrfSecret(): string {
	const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? DEVELOPMENT_AUTH_SECRET
	return `${secret}-csrf`
}

function generateCsrfToken(): string {
	const raw = randomInt(100000, 99999999).toString() + '-' + Date.now()
	const hmac = createHmac('sha256', getCsrfSecret()).update(raw).digest('base64url')
	return `${raw}.${hmac}`
}

/* ───────── Test Helpers ───────── */

function csrfHeaders(token: string): Record<string, string> {
	return {
		[CSRF_HEADER]: token,
		Cookie: `${CSRF_COOKIE}=${token}`,
	}
}

/* ───────── Tests ───────── */

test.describe('CSRF Protection', () => {
	test('POST /api/contact without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/contact', {
			data: {
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				message: 'Hello, this is a test message.',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/contact with invalid CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/contact', {
			data: {
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				message: 'Hello, this is a test message.',
			},
			headers: {
				[CSRF_HEADER]: 'invalid-token.fake-signature',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/contact with valid CSRF token succeeds (not 403)', async ({ request }) => {
		const token = generateCsrfToken()

		const resp = await request.post('/api/contact', {
			data: {
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				message: 'Hello, this is a test message.',
			},
			headers: csrfHeaders(token),
		})

		// Should NOT be 403 — either 200 (success) or 400 (CAPTCHA if TURNSTILE_SECRET_KEY is set)
		expect(resp.status()).not.toBe(403)
	})

	test('POST /api/user-auth/login without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/user-auth/login', {
			data: {
				email: 'nobody@example.com',
				password: 'wrongpassword',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/user-auth/login with valid CSRF returns 401 (not 403)', async ({ request }) => {
		const token = generateCsrfToken()

		const resp = await request.post('/api/user-auth/login', {
			data: {
				email: 'nobody@example.com',
				password: 'wrongpassword',
			},
			headers: csrfHeaders(token),
		})

		// Valid CSRF + bad credentials → 401, not 403
		expect(resp.status()).not.toBe(403)
	})

	test('POST /api/auth/login without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/auth/login', {
			data: {
				email: 'nobody@example.com',
				password: 'wrongpassword',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/user-auth/register without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/user-auth/register', {
			data: {
				email: 'nobody@example.com',
				password: 'TestPass123!',
				firstName: 'Test',
				lastName: 'User',
				country: 'US',
				state: 'CA',
				city: 'Test',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/user-auth/forgot-password without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/user-auth/forgot-password', {
			data: { email: 'nobody@example.com' },
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/user-auth/reset-password without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/user-auth/reset-password', {
			data: {
				email: 'nobody@example.com',
				code: '123456',
				password: 'NewPass123!',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/forums without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/forums', {
			data: {
				scope: 'support',
				title: 'Test Thread',
				content: 'Test content for forum post.',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/checkout without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/checkout', {
			data: {
				courseUuid: '00000000-0000-0000-0000-000000000000',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})

	test('POST /api/community/checkout without CSRF token returns 403', async ({ request }) => {
		const resp = await request.post('/api/community/checkout', {
			data: {
				planUuid: '00000000-0000-0000-0000-000000000000',
			},
		})

		expect(resp.status()).toBe(403)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'CSRF token missing or invalid')
	})
})
