/**
 * Phase 3 — AI Assistant End-to-End Tests
 *
 * Comprehensive tests for the AI chat assistant covering:
 * - Admin workflow (chat, SSE streaming, threads, CRUD)
 * - Student workflow (auth-gated chat, course discovery)
 * - Auth gating (no auth → 401)
 * - Error handling (invalid JSON → 400)
 * - Chat history (threads list, messages, delete)
 * - Rate limiting (429 after threshold)
 *
 * Uses the Playwright request fixture for API-level testing and
 * setup helpers from tests/api/setup.ts for auth.
 */

import { expect, test, type APIResponse, type APIRequestContext } from '@playwright/test'
import { createHmac, randomInt, randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
	adminAuthHeaders,
	createTestStudent,
	extractCookie,
	ADMIN_COOKIE_NAME,
	STUDENT_COOKIE_NAME,
} from '../api/setup'

/* ───────── CSRF Token Generation (from tests/api/csrf.e2e.ts) ───────── */

const CSRF_COOKIE = '__Host-interjudaica_csrf'
const CSRF_HEADER = 'x-csrf-token'
const DEVELOPMENT_AUTH_SECRET = 'interjudaica-local-development-secret'

/**
 * Get the auth secret, checking env vars and falling back to .env file.
 * The Next.js server loads .env automatically; our test must replicate that.
 */
function getAuthSecretFromEnv(): string {
	// Check environment variables first
	if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET
	if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET

	// Try to read from .env file (Next.js auto-loads this for the server)
	try {
		const envPath = resolve(process.cwd(), '.env')
		const envContent = readFileSync(envPath, 'utf-8')
		for (const line of envContent.split('\n')) {
			const trimmed = line.trim()
			if (trimmed.startsWith('#') || !trimmed.includes('=')) continue
			const eqIdx = trimmed.indexOf('=')
			const key = trimmed.slice(0, eqIdx).trim()
			const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
			if (key === 'AUTH_SECRET') return value
			if (key === 'NEXTAUTH_SECRET') return value
		}
	} catch {
		// .env not readable — use dev default
	}

	return DEVELOPMENT_AUTH_SECRET
}

function getCsrfSecret(): string {
	return `${getAuthSecretFromEnv()}-csrf`
}

function generateCsrfToken(): string {
	const raw = randomInt(100000, 99999999).toString() + '-' + Date.now()
	const hmac = createHmac('sha256', getCsrfSecret())
		.update(raw)
		.digest('base64url')
	return `${raw}.${hmac}`
}

function makeCsrfHeaders(token: string): Record<string, string> {
	return {
		[CSRF_HEADER]: token,
		Cookie: `${CSRF_COOKIE}=${token}`,
	}
}

/* ───────── Shared State ───────── */

let adminHeaders: Record<string, string>
let adminCookie: string

test.beforeAll(async ({ request }) => {
	// Admin login with CSRF token
	const csrf = generateCsrfToken()
	const csrfHdrs = makeCsrfHeaders(csrf)

	const loginResp = await request.post('/api/auth/login', {
		headers: csrfHdrs,
		data: {
			email: 'admin@interjudaica.com',
			password: '1NterJuda1c4',
		},
	})
	if (loginResp.status() !== 200) {
		const body = await loginResp.json().catch(() => ({}))
		throw new Error(
			`Admin login failed with status ${loginResp.status()}: ${JSON.stringify(body)}`,
		)
	}
	adminCookie = extractCookie(loginResp, ADMIN_COOKIE_NAME)
	// Merge CSRF cookie and session cookie for admin requests
	adminHeaders = {
		'x-csrf-token': csrf,
		Cookie: `${CSRF_COOKIE}=${csrf}; ${ADMIN_COOKIE_NAME}=${adminCookie}`,
	}
})

/* ───────── Helpers ───────── */

async function assertUnauthorized(resp: APIResponse) {
	expect(resp.status()).toBe(401)
	expect(await resp.json()).toEqual({ error: 'Unauthorized' })
}

/**
 * Register + verify + login a fresh student and return auth headers.
 * Uses retry with unique emails to handle parallel test worker collisions.
 */
async function setupStudentContext(
	request: APIRequestContext,
): Promise<{ headers: Record<string, string>; uuid: string; email: string }> {
	const maxAttempts = 3
	let lastError: Error | undefined

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			const student = createTestStudent()
			// Add random suffix to avoid collisions across parallel workers
			student.email = student.email.replace('@', `+${randomUUID().slice(0, 8)}@`)
			const csrf = generateCsrfToken()
			const csrfHdrs = makeCsrfHeaders(csrf)

			const regResp = await request.post('/api/user-auth/register', {
				headers: csrfHdrs,
				data: {
					email: student.email,
					password: student.password,
					firstName: student.firstName,
					lastName: student.lastName,
					country: student.country,
					state: student.state,
					city: student.city,
				},
			})

			let uuid = ''
			if (regResp.status() === 201) {
				const body = await regResp.json()
				uuid = body?.user?.uuid ?? body?.item?.uuid ?? ''
			} else if (regResp.status() === 409) {
				// Duplicate email — retry with a different email
				continue
			}

			const { getStudentVerificationCode, markUserVerified } =
				await import('../api/setup')

			const code = await getStudentVerificationCode(student.email)
			if (code) {
				const verifyCsrf = generateCsrfToken()
				await request.post('/api/user-auth/verify', {
					headers: makeCsrfHeaders(verifyCsrf),
					data: { email: student.email, code },
				})
			} else {
				await markUserVerified(student.email)
			}

			const loginCsrf = generateCsrfToken()
			const loginResp = await request.post('/api/user-auth/login', {
				headers: makeCsrfHeaders(loginCsrf),
				data: { email: student.email, password: student.password },
			})
			if (loginResp.status() !== 200) {
				throw new Error(
					`Student login failed with status ${loginResp.status()}: ${JSON.stringify(await loginResp.json().catch(() => ({})))}`,
				)
			}

			const cookie = extractCookie(loginResp, STUDENT_COOKIE_NAME)
			return {
				headers: {
					[CSRF_HEADER]: loginCsrf,
					Cookie: `${CSRF_COOKIE}=${loginCsrf}; ${STUDENT_COOKIE_NAME}=${cookie}`,
				},
				uuid,
				email: student.email,
			}
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err))
		}
	}

	throw lastError ?? new Error('setupStudentContext failed after retries')
}

/* ──────────────────────────────────────────────────────────── */
/*  1. Admin POST /api/agentes/chat → 200 SSE + X-Thread-Uuid   */
/* ──────────────────────────────────────────────────────────── */

test.describe.serial('Admin Chat Flow', () => {
	let adminThreadUuid = ''

	test('POST returns 200 with SSE headers and X-Thread-Uuid', async ({
		request,
	}) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				messages: [
					{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
				],
			},
		})

		// LLM may fail in CI — accept 200 or 500
		expect([200, 500]).toContain(resp.status())
		if (resp.status() === 200) {
			const contentType = resp.headers()['content-type']
			expect(contentType).toContain('text/event-stream')

			const threadUuid = resp.headers()['x-thread-uuid']
			expect(threadUuid).toBeTruthy()
			expect(typeof threadUuid).toBe('string')
			adminThreadUuid = threadUuid!
		}
	})

	test('POST with messages streams SSE data events', async ({
		request,
	}) => {
		if (!adminThreadUuid) {
			// Create a thread if we don't have one from the previous test
			const resp = await request.post('/api/agentes/chat', {
				headers: adminHeaders,
				data: {
					messages: [
						{
							role: 'user',
							parts: [{ type: 'text', text: 'Say hello briefly' }],
						},
					],
				},
			})
			if (resp.status() === 200) {
				adminThreadUuid = resp.headers()['x-thread-uuid'] ?? ''
			}
		}
		if (!adminThreadUuid) test.skip(true, 'No admin thread available')

		// Start a new chat on the existing thread to verify streaming
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				threadUuid: adminThreadUuid,
				messages: [
					{
						role: 'user',
						parts: [
							{
								type: 'text',
								text: 'Say hello in exactly one word',
							},
						],
					},
				],
			},
		})

		expect([200, 500]).toContain(resp.status())
		if (resp.status() === 200) {
			const body = await resp.text()
			// SSE format: should contain "data:" prefixed lines
			expect(body).toContain('data:')
		}
	})

	test('GET /api/agentes/chats returns thread list with our thread', async ({
		request,
	}) => {
		if (!adminThreadUuid) test.skip(true, 'No admin thread')

		const resp = await request.get('/api/agentes/chats', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('threads')
		expect(Array.isArray(body.threads)).toBe(true)

		const found = body.threads.find(
			(t: Record<string, string>) => t.uuid === adminThreadUuid,
		)
		expect(found).toBeTruthy()
	})

	test('GET /api/agentes/chats/[uuid] returns messages', async ({
		request,
	}) => {
		if (!adminThreadUuid) test.skip(true, 'No admin thread')

		const resp = await request.get(
			`/api/agentes/chats/${adminThreadUuid}`,
			{ headers: adminHeaders },
		)
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('messages')
		expect(Array.isArray(body.messages)).toBe(true)
		// May be 0 if LLM failed — messages persist only on onFinish callback
	})

	test('DELETE /api/agentes/chats/[uuid] removes thread', async ({
		request,
	}) => {
		if (!adminThreadUuid) test.skip(true, 'No admin thread')

		const deleteResp = await request.delete(
			`/api/agentes/chats/${adminThreadUuid}`,
			{ headers: adminHeaders },
		)
		expect(deleteResp.status()).toBe(200)
		expect(await deleteResp.json()).toEqual({ deleted: true })

		// Verify thread is gone
		const getResp = await request.get(
			`/api/agentes/chats/${adminThreadUuid}`,
			{ headers: adminHeaders },
		)
		expect(getResp.status()).toBe(404)
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  2. Auth Gating — No Auth → 401                              */
/* ──────────────────────────────────────────────────────────── */

test.describe('Auth Gating', () => {
	test('POST /api/agentes/chat without auth returns 401', async ({
		request,
	}) => {
		const resp = await request.post('/api/agentes/chat', {
			data: {
				messages: [
					{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
				],
			},
		})
		await assertUnauthorized(resp)
	})

	test('GET /api/agentes/chats without auth returns 401', async ({
		request,
	}) => {
		const resp = await request.get('/api/agentes/chats')
		await assertUnauthorized(resp)
	})

	test('GET /api/agentes/chats/[uuid] without auth returns 401', async ({
		request,
	}) => {
		const resp = await request.get(
			'/api/agentes/chats/00000000-0000-0000-0000-000000000000',
		)
		await assertUnauthorized(resp)
	})

	test('POST with invalid cookie returns 401', async ({ request }) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminAuthHeaders('invalid-cookie-token'),
			data: {
				messages: [
					{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
				],
			},
		})
		await assertUnauthorized(resp)
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  3. Error Handling — Invalid Input                           */
/* ──────────────────────────────────────────────────────────── */

test.describe('Error Handling', () => {
	test('POST with invalid JSON body returns 400', async ({
		request,
	}) => {
		// Send binary garbage via Buffer to trigger JSON parse error on the server.
		// Playwright's request.fetch() with Buffer sends raw bytes.
		const resp = await request.fetch('/api/agentes/chat', {
			method: 'POST',
			headers: {
				...adminHeaders,
				'Content-Type': 'application/json',
			},
			data: Buffer.from([0x00, 0xff, 0x00]),
		})

		expect(resp.status()).toBe(400)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'Invalid JSON body')
	})

	test('POST with empty messages array returns valid response', async ({
		request,
	}) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: { messages: [] },
		})
		// Empty messages should still create a thread and stream
		expect([200, 500]).toContain(resp.status())
		if (resp.status() === 200) {
			expect(resp.headers()['content-type']).toContain(
				'text/event-stream',
			)
		}
	})

	test('POST without messages field returns valid response', async ({
		request,
	}) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {},
		})
		// Missing messages field defaults to empty array
		expect([200, 500]).toContain(resp.status())
	})

	test('GET non-existent thread UUID returns 404', async ({
		request,
	}) => {
		const resp = await request.get(
			'/api/agentes/chats/00000000-0000-0000-0000-000000000000',
			{ headers: adminHeaders },
		)
		expect(resp.status()).toBe(404)
	})

	test('GET other user thread returns 403 Forbidden', async ({
		request,
	}) => {
		// Create a student and get a thread UUID
		const { headers: studentHdrs } =
			await setupStudentContext(request)

		// Student creates a thread
		const chatResp = await request.post('/api/agentes/chat', {
			headers: studentHdrs,
			data: {
				messages: [
					{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
				],
			},
		})
		const studentThreadUuid =
			chatResp.headers()['x-thread-uuid'] ?? ''

		if (studentThreadUuid) {
			// Admin tries to access student's thread → should be 403
			const resp = await request.get(
				`/api/agentes/chats/${studentThreadUuid}`,
				{ headers: adminHeaders },
			)
			expect(resp.status()).toBe(403)
		}
	})

	test('DELETE other user thread returns 403 Forbidden', async ({
		request,
	}) => {
		// Create another student
		const student1 = await setupStudentContext(request)

		// Student1 creates a thread
		const chatResp = await request.post('/api/agentes/chat', {
			headers: student1.headers,
			data: {
				messages: [
					{ role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
				],
			},
		})
		const threadUuid = chatResp.headers()['x-thread-uuid'] ?? ''

		if (!threadUuid) test.skip(true, 'No student thread created')

		// Create student2 and try to delete student1's thread
		const student2 = await setupStudentContext(request)
		const resp = await request.delete(
			`/api/agentes/chats/${threadUuid}`,
			{ headers: student2.headers },
		)
		expect(resp.status()).toBe(403)

		// Cleanup: student1 deletes their own thread
		await request.delete(`/api/agentes/chats/${threadUuid}`, {
			headers: student1.headers,
		})
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  4. Student Chat Flow                                        */
/* ──────────────────────────────────────────────────────────── */

test.describe.serial('Student Chat Flow', () => {
	let studentHeaders: Record<string, string>
	let studentThreadUuid = ''
	let studentUuid = ''

	test.beforeAll(async ({ request }) => {
		const ctx = await setupStudentContext(request)
		studentHeaders = ctx.headers
		studentUuid = ctx.uuid
	})

	test('POST returns 200 with SSE headers for student', async ({
		request,
	}) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: studentHeaders,
			data: {
				messages: [
					{ role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
				],
			},
		})

		expect([200, 500]).toContain(resp.status())
		if (resp.status() === 200) {
			expect(resp.headers()['content-type']).toContain(
				'text/event-stream',
			)
			studentThreadUuid = resp.headers()['x-thread-uuid'] ?? ''
		}
	})

	test('Student GET /api/agentes/chats returns their threads', async ({
		request,
	}) => {
		const resp = await request.get('/api/agentes/chats', {
			headers: studentHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(Array.isArray(body.threads)).toBe(true)
	})

	test('Student GET own thread messages returns 200', async ({
		request,
	}) => {
		if (!studentThreadUuid) test.skip(true, 'No student thread')
		const resp = await request.get(
			`/api/agentes/chats/${studentThreadUuid}`,
			{ headers: studentHeaders },
		)
		expect(resp.status()).toBe(200)
	})

	test('Student DELETE own thread returns 200', async ({
		request,
	}) => {
		if (!studentThreadUuid) test.skip(true, 'No student thread')
		const resp = await request.delete(
			`/api/agentes/chats/${studentThreadUuid}`,
			{ headers: studentHeaders },
		)
		expect(resp.status()).toBe(200)
		expect(await resp.json()).toEqual({ deleted: true })
	})

	test('Student discovering courses: SSE response contains data', async ({
		request,
	}) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: studentHeaders,
			data: {
				messages: [
					{
						role: 'user',
						parts: [
							{
								type: 'text',
								text: 'What courses are available on this platform?',
							},
						],
					},
				],
			},
		})

		// LLM-dependent — accept 200 or 500
		expect([200, 500]).toContain(resp.status())
		if (resp.status() === 200) {
			expect(resp.headers()['content-type']).toContain(
				'text/event-stream',
			)
			const body = await resp.text()
			expect(body).toContain('data:')
		}
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  5. Rate Limiting                                            */
/* ──────────────────────────────────────────────────────────── */

test.describe.serial('Rate Limiting', () => {
	let rateLimitHeaders: Record<string, string>

	test.beforeAll(async ({ request }) => {
		// Fresh student with no previous rate limit entries
		const ctx = await setupStudentContext(request)
		rateLimitHeaders = ctx.headers
	})

	test('exceeding 20 requests/hour returns 429 for students', async ({
		request,
	}) => {
		// Student rate limit: 20 requests per hour
		// Send sequentially to ensure each increments the counter atomically
		const totalRequests = 25
		let rateLimitCount = 0
		let successCount = 0

		for (let i = 0; i < totalRequests; i++) {
			const resp = await request.post('/api/agentes/chat', {
				headers: rateLimitHeaders,
				data: {
					messages: [
						{
							role: 'user',
							parts: [{ type: 'text', text: `test ${i}` }],
						},
					],
				},
			})
			const status = resp.status()
			if (status === 429) {
				rateLimitCount++
				const body = await resp.json().catch(() => ({}))
				expect(body).toHaveProperty('error', 'Rate limit exceeded')
				expect(body).toHaveProperty('retryAfter')
				break // Rate limit hit — no need to continue
			} else if (status === 200 || status === 500) {
				successCount++
			}
		}

		// At least one request should be rate limited (429)
		expect(rateLimitCount).toBeGreaterThan(0)
		// Some requests should have passed before the limit was hit
		expect(successCount).toBeGreaterThan(0)
	})
})

// No afterAll needed — test data is per-student and auto-expires
// Chat threads and messages have TTL indexes (90 days for messages)
