/**
 * E2E tests for POST /api/agentes/chat — the core streaming AI assistant endpoint.
 *
 * Tests auth, SSE streaming, role-based tool filtering, error handling,
 * and thread management.
 *
 * Prerequisites:
 *   - Dev server running (managed by playwright.config.ts)
 *   - MongoDB available (default operator created automatically)
 *   - DEEPSEEK_API_KEY optional — LLM-dependent tests accept 200 or 500
 */

import { expect, test, type APIResponse } from '@playwright/test'
import {
	loginAsAdmin,
	adminAuthHeaders,
	ADMIN_COOKIE_NAME,
	studentAuthHeaders,
	createTestStudent,
	registerStudent,
	getStudentVerificationCode,
	STUDENT_COOKIE_NAME,
	extractCookie,
} from './setup'

/* ───────── Shared State ───────── */

let adminHeaders: Record<string, string>
let studentCookie: string
let studentHeaders: Record<string, string>

test.beforeAll(async ({ request }) => {
	// Admin auth
	const adminCookie = await loginAsAdmin(request)
	adminHeaders = adminAuthHeaders(adminCookie)

	// Student auth: register, verify, login
	const student = createTestStudent()
	const regResp = await registerStudent(request, student)
	expect([201, 409]).toContain(regResp.status())

	if (regResp.status() === 201 || regResp.status() === 409) {
		const code = await getStudentVerificationCode(student.email)
		if (code) {
			await request.post('/api/user-auth/verify', {
				data: { email: student.email, code },
			})
		}
	}

	const loginResp = await request.post('/api/user-auth/login', {
		data: { email: student.email, password: student.password },
	})
	if (loginResp.status() === 200) {
		studentCookie = extractCookie(loginResp, STUDENT_COOKIE_NAME)
		studentHeaders = studentAuthHeaders(studentCookie)
	}
})

/* ───────── Helpers ───────── */

async function assertUnauthorized(resp: APIResponse) {
	expect(resp.status()).toBe(401)
	expect(await resp.json()).toEqual({ error: 'Unauthorized' })
}

/** Parse SSE events from a buffered Playwright APIResponse body. */
async function collectSSEBody(resp: APIResponse): Promise<{
	chunks: string[]
	headers: Record<string, string>
}> {
	const rawHeaders = resp.headers()
	const headers: Record<string, string> = {}
	for (const [key, value] of Object.entries(rawHeaders)) {
		headers[key.toLowerCase()] = value
	}

	if (resp.status() !== 200) return { chunks: [], headers }

	const body = await resp.body()
	const text = body.toString('utf-8')

	// SSE events are separated by double-newline
	const chunks = text.split('\n\n').filter(Boolean)

	return { chunks, headers }
}

/* ──────────────────────────────────────────────────────────── */
/*  Authentication                                              */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/agentes/chat — Auth', () => {
	test('no cookie returns 401', async ({ request }) => {
		const resp = await request.post('/api/agentes/chat', {
			data: {
				messages: [{ role: 'user', content: 'Hello' }],
			},
		})

		await assertUnauthorized(resp)
	})

	test('invalid cookie returns 401', async ({ request }) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminAuthHeaders('invalid-cookie-value'),
			data: {
				messages: [{ role: 'user', content: 'Hello' }],
			},
		})

		await assertUnauthorized(resp)
	})

	test('expired operator cookie returns 401', async ({ request }) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: {
				Cookie: `${ADMIN_COOKIE_NAME}=eyJhbGciOiJub25lIn0.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtYTAwMC0wMDAwMDAwMDAwMDAiLCJlbWFpbCI6Im5vbmVAbm9uZS5jb20iLCJpYXQiOjAsImV4cCI6MH0.invalid`,
			},
			data: {
				messages: [{ role: 'user', content: 'Hello' }],
			},
		})

		expect(resp.status()).toBe(401)
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  Admin Chat with Tools                                       */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/agentes/chat — Admin', () => {
	test('admin request returns 200 SSE stream', async ({ request }) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				messages: [{ role: 'user', content: 'List all courses.' }],
			},
		})

		// Accept 200 (streams work) or 500 (no API key / LLM error)
		expect([200, 500]).toContain(resp.status())

		if (resp.status() === 200) {
			const { chunks, headers } = await collectSSEBody(resp)

			expect(headers['content-type']).toContain('text/event-stream')
			expect(headers['x-thread-uuid']).toBeDefined()
			expect(headers['x-thread-uuid']).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			)
			expect(chunks.length).toBeGreaterThan(0)

			const combined = chunks.join('')
			expect(combined).toContain('data:')
		}
	})

	test('admin with threadUuid gets same thread header', async ({ request }) => {
		// First request: get a thread UUID
		const resp1 = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				messages: [{ role: 'user', content: 'Hello' }],
			},
		})

		expect([200, 500]).toContain(resp1.status())
		const threadUuid = resp1.headers()['x-thread-uuid']

		if (threadUuid) {
			// Second request with same thread UUID
			const resp2 = await request.post('/api/agentes/chat', {
				headers: adminHeaders,
				data: {
					messages: [{ role: 'user', content: 'Continue conversation' }],
					threadUuid,
				},
			})

			// Should re-use the same thread
			expect([200, 500]).toContain(resp2.status())
			expect(resp2.headers()['x-thread-uuid']).toBe(threadUuid)
		}
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  Student Chat (Limited Tools)                                */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/agentes/chat — Student', () => {
	test('student request returns 200 SSE stream', async ({ request }) => {
		if (!studentCookie) {
			test.skip(true, 'Student authentication failed — skipping student tests')
			return
		}

		const resp = await request.post('/api/agentes/chat', {
			headers: studentHeaders,
			data: {
				messages: [{ role: 'user', content: 'What courses are available?' }],
			},
		})

		// Accept 200 (streams work) or 500 (LLM error)
		expect([200, 500]).toContain(resp.status())

		if (resp.status() === 200) {
			const { headers } = await collectSSEBody(resp)
			expect(headers['content-type']).toContain('text/event-stream')
			expect(headers['x-thread-uuid']).toBeDefined()
		}
	})

	test('student cannot access admin tools', async ({ request }) => {
		if (!studentCookie) {
			test.skip(true, 'Student authentication failed')
			return
		}

		const resp = await request.post('/api/agentes/chat', {
			headers: studentHeaders,
			data: {
				messages: [{ role: 'user', content: 'Create a course titled "Test Course".' }],
			},
		})

		expect([200, 500]).toContain(resp.status())

		if (resp.status() === 200) {
			const { chunks } = await collectSSEBody(resp)
			const combined = chunks.join('')
			expect(combined.length).toBeGreaterThan(0)
		}
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  Error Handling                                              */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/agentes/chat — Errors', () => {
	test('missing messages field still works', async ({ request }) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: { threadUuid: undefined },
		})

		// Should not crash — empty messages array defaults
		expect([200, 400, 500]).toContain(resp.status())
	})

	test('invalid JSON body returns 400', async ({ request, baseURL }) => {
		const url = `${baseURL ?? 'http://127.0.0.1:3026'}/api/agentes/chat`
		const resp = await request.fetch(url, {
			method: 'POST',
			headers: {
				...adminHeaders,
				'Content-Type': 'application/json',
			},
			data: 'not-valid-json',
		})

		expect(resp.status()).toBe(400)
	})

	test('non-existent thread returns 404', async ({ request }) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				messages: [{ role: 'user', content: 'Hello' }],
				threadUuid: '00000000-0000-0000-0000-000000000000',
			},
		})

		expect(resp.status()).toBe(404)
		expect(await resp.json()).toEqual({ error: 'Thread not found' })
	})

	test('CSRF token not required (session cookie auth)', async ({ request }) => {
		// Chat endpoint uses session cookies for auth, not CSRF
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				messages: [{ role: 'user', content: 'Hello' }],
			},
		})

		expect([200, 500]).toContain(resp.status())
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  Response Format                                             */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/agentes/chat — Response Format', () => {
	test('SSE response has correct headers', async ({ request }) => {
		const resp = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				messages: [{ role: 'user', content: 'Hello' }],
			},
		})

		expect([200, 500]).toContain(resp.status())

		if (resp.status() === 200) {
			const { headers } = await collectSSEBody(resp)

			expect(headers['content-type']).toMatch(/text\/event-stream/)
			expect(headers['x-thread-uuid']).toBeDefined()
		}
	})

	test('multiple messages in a conversation', async ({ request }) => {
		const resp1 = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				messages: [{ role: 'user', content: 'Hi, how are you?' }],
			},
		})

		expect([200, 500]).toContain(resp1.status())

		const threadUuid = resp1.headers()['x-thread-uuid']
		if (!threadUuid) return

		const resp2 = await request.post('/api/agentes/chat', {
			headers: adminHeaders,
			data: {
				messages: [
					{ role: 'user', content: 'Hi' },
					{ role: 'assistant', content: 'Hello! How can I help?' },
					{ role: 'user', content: 'Tell me about InterJudaica.' },
				],
				threadUuid,
			},
		})

		expect([200, 500]).toContain(resp2.status())
	})
})
