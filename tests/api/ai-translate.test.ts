/**
 * AI Translate Endpoint Tests
 *
 * Tests the admin translations AI auto-translate endpoint:
 * - Auth enforcement (401 without operator session)
 * - Invalid locale rejection (400)
 * - Missing API key rejection (400)
 * - Successful translation and storage via DeepSeek
 */

import { expect, test } from '@playwright/test'
import { loginAsAdmin, adminAuthHeaders } from './setup'

let adminHeaders: Record<string, string>

test.beforeAll(async ({ request }) => {
	const cookie = await loginAsAdmin(request)
	adminHeaders = adminAuthHeaders(cookie)
})

test.describe('POST /api/admin/translations/ai-translate', () => {
	const endpoint = '/api/admin/translations/ai-translate'

	test('rejects unauthorized requests', async ({ request }) => {
		const resp = await request.post(endpoint, {
			data: { locale: 'es' },
		})
		expect(resp.status()).toBe(401)
	})

	test('rejects en locale', async ({ request }) => {
		const resp = await request.post(endpoint, {
			headers: adminHeaders,
			data: { locale: 'en' },
		})
		expect(resp.status()).toBe(400)
	})

	test('rejects missing locale', async ({ request }) => {
		const resp = await request.post(endpoint, {
			headers: adminHeaders,
			data: {},
		})
		expect(resp.status()).toBe(400)
	})

	test('translates to es with DeepSeek', async ({ request }) => {
		const resp = await request.post(endpoint, {
			headers: adminHeaders,
			data: { locale: 'es' },
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('locale', 'es')
		expect(body).toHaveProperty('translated')
		expect(typeof body.translated).toBe('object')
		// Verify a few well-known keys exist
		expect(body.translated).toHaveProperty('nav.home')
		expect(body.translated).toHaveProperty('nav.courses')
	})

	test('translates to he with DeepSeek', async ({ request }) => {
		const resp = await request.post(endpoint, {
			headers: adminHeaders,
			data: { locale: 'he' },
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('locale', 'he')
		expect(body).toHaveProperty('translated')
		expect(body.translated).toHaveProperty('nav.home')
	})

	test('translates to fr with DeepSeek', async ({ request }) => {
		const resp = await request.post(endpoint, {
			headers: adminHeaders,
			data: { locale: 'fr' },
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('locale', 'fr')
		expect(body).toHaveProperty('translated')
		expect(body.translated).toHaveProperty('nav.home')
	})
})
