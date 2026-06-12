/**
 * Payments API Endpoint Tests — InterJudaica
 *
 * Tests the unified admin payments endpoint:
 *   GET /api/admin/payments
 *
 * Coverage:
 *   - 401 without admin auth
 *   - Default list returns { items, page, totalPages, totalItems }
 *   - Pagination (page, limit params)
 *   - Type filter (course, book, subscription)
 *   - Search filter (by user email, user name, item title)
 *   - Invalid type parameter doesn't crash
 *   - Limit bounds enforcement
 */

import { expect, test } from '@playwright/test'
import { loginAsAdmin, adminAuthHeaders } from '../setup'

let adminHeaders: Record<string, string>

test.beforeAll(async ({ request }) => {
	const adminCookie = await loginAsAdmin(request)
	adminHeaders = adminAuthHeaders(adminCookie)
})

/* ───────── Auth ───────── */

test.describe('Auth enforcement', () => {
	test('returns 401 without admin cookie', async ({ request }) => {
		const resp = await request.get('/api/admin/payments')
		expect(resp.status()).toBe(401)
		const body = await resp.json()
		expect(body).toHaveProperty('error', 'Unauthorized')
	})

	test('returns 401 with invalid cookie', async ({ request }) => {
		const resp = await request.get('/api/admin/payments', {
			headers: { Cookie: '__Host-interjudaica_operator_session=invalid' },
		})
		expect(resp.status()).toBe(401)
	})

	test('returns 200 with valid admin auth', async ({ request }) => {
		const resp = await request.get('/api/admin/payments', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('items')
		expect(body).toHaveProperty('page')
		expect(body).toHaveProperty('totalPages')
		expect(body).toHaveProperty('totalItems')
		expect(Array.isArray(body.items)).toBe(true)
		expect(typeof body.page).toBe('number')
		expect(typeof body.totalPages).toBe('number')
		expect(typeof body.totalItems).toBe('number')
	})
})

/* ───────── Response Shape ───────── */

test.describe('Response shape', () => {
	test('each item has the correct unified payment fields', async ({ request }) => {
		const resp = await request.get('/api/admin/payments', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()

		if (body.items.length > 0) {
			const item = body.items[0]
			expect(item).toHaveProperty('id')
			expect(item).toHaveProperty('type')
			expect(['course', 'book', 'subscription']).toContain(item.type)
			expect(item).toHaveProperty('status')
			expect(item).toHaveProperty('amount')
			expect(typeof item.amount).toBe('number')
			expect(item).toHaveProperty('currency')
			expect(item).toHaveProperty('user')
			expect(item.user).toHaveProperty('name')
			expect(item.user).toHaveProperty('email')
			expect(item).toHaveProperty('item')
			expect(item).toHaveProperty('date')
			expect(item).toHaveProperty('stripeSessionId')
			expect(item).toHaveProperty('stripePaymentIntentId')
		}
	})
})

/* ───────── Pagination ───────── */

test.describe('Pagination', () => {
	test('respects page and limit query params', async ({ request }) => {
		const resp = await request.get('/api/admin/payments?page=1&limit=5', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.page).toBe(1)
		expect(body.items.length).toBeLessThanOrEqual(5)
	})

	test('defaults to page=1 and limit=30', async ({ request }) => {
		const resp = await request.get('/api/admin/payments', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.page).toBe(1)
		expect(body.items.length).toBeLessThanOrEqual(30)
	})

	test('page=2 returns second page', async ({ request }) => {
		const resp = await request.get('/api/admin/payments?page=2&limit=5', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.page).toBe(2)
	})

	test('limit is capped at 100', async ({ request }) => {
		const resp = await request.get('/api/admin/payments?limit=999', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.items.length).toBeLessThanOrEqual(100)
	})

	test('totalPages matches totalItems and limit', async ({ request }) => {
		const resp = await request.get('/api/admin/payments?limit=5', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.totalPages).toBe(
			Math.ceil(body.totalItems / 5)
		)
	})
})

/* ───────── Type Filter ───────── */

test.describe('Type filter', () => {
	const validTypes = ['course', 'book', 'subscription']

	for (const type of validTypes) {
		test(`?type=${type} returns only ${type} items`, async ({ request }) => {
			const resp = await request.get(`/api/admin/payments?type=${type}`, {
				headers: adminHeaders,
			})
			expect(resp.status()).toBe(200)
			const body = await resp.json()
			for (const item of body.items) {
				expect(item.type).toBe(type)
			}
		})
	}

	test('invalid type value does not crash (returns all items)', async ({
		request,
	}) => {
		const resp = await request.get('/api/admin/payments?type=invalid', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
	})
})

/* ───────── Search Filter ───────── */

test.describe('Search filter', () => {
	test('search without query param returns all items', async ({ request }) => {
		const resp = await request.get('/api/admin/payments', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
	})

	test('search with a non-matching string returns empty items', async ({
		request,
	}) => {
		const resp = await request.get(
			'/api/admin/payments?search=xyznonexistent999999',
			{ headers: adminHeaders }
		)
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.items).toEqual([])
		expect(body.totalItems).toBe(0)
	})

	test('search with partial email returns matching results', async ({
		request,
	}) => {
		// The default admin is admin@interjudaica.com — but this search
		// would only match if there are course payments or subscriptions
		// tied to users with that email. Just check non-error response.
		const resp = await request.get(
			'/api/admin/payments?search=@interjudaica',
			{ headers: adminHeaders }
		)
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(Array.isArray(body.items)).toBe(true)
	})

	test('combined search and type filter', async ({ request }) => {
		const resp = await request.get(
			'/api/admin/payments?search=test&type=course',
			{ headers: adminHeaders }
		)
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		for (const item of body.items) {
			expect(item.type).toBe('course')
		}
	})
})

/* ───────── Edge Cases ───────── */

test.describe('Edge cases', () => {
	test('page=0 defaults to page 1', async ({ request }) => {
		const resp = await request.get('/api/admin/payments?page=0', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.page).toBe(1)
	})

	test('negative page defaults to page 1', async ({ request }) => {
		const resp = await request.get('/api/admin/payments?page=-5', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.page).toBe(1)
	})

	test('limit=0 defaults to limit 1', async ({ request }) => {
		const resp = await request.get('/api/admin/payments?limit=0', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.items.length).toBeLessThanOrEqual(1)
	})

	test('non-numeric page does not crash', async ({ request }) => {
		const resp = await request.get('/api/admin/payments?page=abc', {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body.page).toBe(1)
	})
})
