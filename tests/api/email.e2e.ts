/**
 * Phase 3 — Email Marketing Endpoint Tests (API-level)
 *
 * Tests all email marketing admin endpoints:
 * - Templates CRUD
 * - Groups CRUD
 * - Campaigns CRUD + run / retry / spooler
 *
 * Uses admin authentication via the setup helper.
 * All email marketing endpoints require admin auth.
 */

import { expect, test, type APIResponse } from '@playwright/test'
import { loginAsAdmin, adminAuthHeaders } from './setup'

/* ───────── Shared State ───────── */

let adminHeaders: Record<string, string>

test.beforeAll(async ({ request }) => {
	const cookie = await loginAsAdmin(request)
	adminHeaders = adminAuthHeaders(cookie)
})

/* ───────── Helper ───────── */

async function assertUnauthorized(resp: APIResponse) {
	expect(resp.status()).toBe(401)
	expect(await resp.json()).toEqual({ error: 'Unauthorized' })
}

/* ──────────────────────────────────────────────────────────── */
/*  Templates                                                    */
/* ──────────────────────────────────────────────────────────── */

test.describe('Admin Email Templates — /api/admin/email/templates', () => {
	const basePath = '/api/admin/email/templates'
	const ts = Date.now()
	let createdUuid = ''

	test('GET list returns items', async ({ request }) => {
		const resp = await request.get(basePath, { headers: adminHeaders })
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('items')
		expect(Array.isArray(body.items)).toBe(true)
	})

	test('GET list without auth returns 401', async ({ request }) => {
		const resp = await request.get(basePath)
		await assertUnauthorized(resp)
	})

	test('POST creates template and returns 201', async ({ request }) => {
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: {
				name: `E2E Template ${ts}`,
				subject: `Test Subject ${ts}`,
				html: '<h1>Hello {{firstname}}</h1><p>Welcome to InterJudaica.</p>',
			},
		})

		expect(resp.status()).toBe(201)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('uuid')
		expect(body.item).toHaveProperty('name', `E2E Template ${ts}`)
		expect(body.item).toHaveProperty('slug')
		expect(body.item).toHaveProperty('subject')
		expect(body.item).toHaveProperty('html')
		createdUuid = body.item.uuid
	})

	test('POST without auth returns 401', async ({ request }) => {
		const resp = await request.post(basePath, {
			data: { name: 'Unauth', subject: 'Test' },
		})
		await assertUnauthorized(resp)
	})

	test('POST with missing name returns 400', async ({ request }) => {
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: { subject: 'Missing name' },
		})
		expect(resp.status()).toBe(400)
		expect(await resp.json()).toEqual({ error: 'Invalid payload' })
	})

	test('POST with missing subject returns 400', async ({ request }) => {
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: { name: `NoSubject ${ts + 1}` },
		})
		expect(resp.status()).toBe(400)
		expect(await resp.json()).toEqual({ error: 'Invalid payload' })
	})

	test('GET item by UUID returns 200', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No template created')
		const resp = await request.get(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('uuid', createdUuid)
	})

	test('GET non-existent UUID returns 404', async ({ request }) => {
		const resp = await request.get(
			`${basePath}/00000000-0000-0000-0000-000000000000`,
			{ headers: adminHeaders },
		)
		expect(resp.status()).toBe(404)
		expect(await resp.json()).toEqual({ error: 'Not found' })
	})

	test('PATCH updates template', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No template created')
		const resp = await request.patch(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
			data: {
				name: `Updated Template ${ts}`,
				subject: `Updated Subject ${ts}`,
				html: '<p>Updated content</p>',
			},
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('name', `Updated Template ${ts}`)
		expect(body.item).toHaveProperty('subject', `Updated Subject ${ts}`)
	})

	test('DELETE removes template', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No template created')
		const resp = await request.delete(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		expect(await resp.json()).toEqual({ deleted: true })
	})

	test('DELETE non-existent UUID returns 404', async ({ request }) => {
		const resp = await request.delete(
			`${basePath}/00000000-0000-0000-0000-000000000000`,
			{ headers: adminHeaders },
		)
		expect(resp.status()).toBe(404)
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  Groups                                                       */
/* ──────────────────────────────────────────────────────────── */

test.describe('Admin Email Groups — /api/admin/email/groups', () => {
	const basePath = '/api/admin/email/groups'
	const ts = Date.now()
	let createdUuid = ''

	test('GET list returns items', async ({ request }) => {
		const resp = await request.get(basePath, { headers: adminHeaders })
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('items')
		expect(Array.isArray(body.items)).toBe(true)
	})

	test('GET list without auth returns 401', async ({ request }) => {
		const resp = await request.get(basePath)
		await assertUnauthorized(resp)
	})

	test('POST creates group and returns 201', async ({ request }) => {
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: {
				name: `E2E Group ${ts}`,
				promoting: 'Community membership',
				query: '{"tags":["test"]}',
			},
		})

		expect(resp.status()).toBe(201)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('uuid')
		expect(body.item).toHaveProperty('name', `E2E Group ${ts}`)
		expect(body.item).toHaveProperty('slug')
		expect(body.item).toHaveProperty('promoting')
		createdUuid = body.item.uuid
	})

	test('POST without auth returns 401', async ({ request }) => {
		const resp = await request.post(basePath, {
			data: { name: 'Unauth', promoting: 'Test' },
		})
		await assertUnauthorized(resp)
	})

	test('POST with missing name returns 400', async ({ request }) => {
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: { promoting: 'Missing name' },
		})
		expect(resp.status()).toBe(400)
		expect(await resp.json()).toEqual({ error: 'Invalid payload' })
	})

	test('POST with missing promoting returns 400', async ({ request }) => {
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: { name: `NoPromoting ${ts + 1}` },
		})
		expect(resp.status()).toBe(400)
		expect(await resp.json()).toEqual({ error: 'Invalid payload' })
	})

	test('GET item by UUID returns 200', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No group created')
		const resp = await request.get(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('uuid', createdUuid)
	})

	test('GET non-existent UUID returns 404', async ({ request }) => {
		const resp = await request.get(
			`${basePath}/00000000-0000-0000-0000-000000000000`,
			{ headers: adminHeaders },
		)
		expect(resp.status()).toBe(404)
		expect(await resp.json()).toEqual({ error: 'Not found' })
	})

	test('PATCH updates group', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No group created')
		const resp = await request.patch(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
			data: {
				name: `Updated Group ${ts}`,
				promoting: 'Updated promoting text',
			},
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('name', `Updated Group ${ts}`)
	})

	test('DELETE removes group', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No group created')
		const resp = await request.delete(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		expect(await resp.json()).toEqual({ deleted: true })
	})

	test('DELETE non-existent UUID returns 404', async ({ request }) => {
		const resp = await request.delete(
			`${basePath}/00000000-0000-0000-0000-000000000000`,
			{ headers: adminHeaders },
		)
		expect(resp.status()).toBe(404)
	})
})

/* ──────────────────────────────────────────────────────────── */
/*  Campaigns                                                    */
/* ──────────────────────────────────────────────────────────── */

test.describe('Admin Email Campaigns — /api/admin/email/campaigns', () => {
	const basePath = '/api/admin/email/campaigns'
	const ts = Date.now()
	let templateUuid = ''
	let groupUuid = ''
	let createdUuid = ''

	// Create prerequisite template and group for campaign tests
	test.beforeAll(async ({ request }) => {
		const tResp = await request.post('/api/admin/email/templates', {
			headers: adminHeaders,
			data: {
				name: `Campaign Template ${ts}`,
				subject: `Campaign Subject ${ts}`,
				html: '<h1>Hello {{firstname}}</h1><p>Campaign content from InterJudaica.</p>',
			},
		})
		if (tResp.status() === 201) {
			templateUuid = (await tResp.json()).item.uuid
		}

		const gResp = await request.post('/api/admin/email/groups', {
			headers: adminHeaders,
			data: {
				name: `Campaign Group ${ts}`,
				promoting: 'Campaign test course',
				query: '{}',
			},
		})
		if (gResp.status() === 201) {
			groupUuid = (await gResp.json()).item.uuid
		}
	})

	// Cleanup prerequisite template and group after all campaign tests
	test.afterAll(async ({ request }) => {
		if (templateUuid) {
			await request.delete(`/api/admin/email/templates/${templateUuid}`, {
				headers: adminHeaders,
			})
		}
		if (groupUuid) {
			await request.delete(`/api/admin/email/groups/${groupUuid}`, {
				headers: adminHeaders,
			})
		}
	})

	/* ─── Campaign CRUD ─── */

	test('GET list returns items with stats', async ({ request }) => {
		const resp = await request.get(basePath, { headers: adminHeaders })
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('items')
		expect(Array.isArray(body.items)).toBe(true)
		if (body.items.length > 0) {
			const first = body.items[0]
			expect(first).toHaveProperty('stats')
			expect(first).toHaveProperty('templateName')
			expect(first).toHaveProperty('groupName')
		}
	})

	test('GET list without auth returns 401', async ({ request }) => {
		const resp = await request.get(basePath)
		await assertUnauthorized(resp)
	})

	test('POST creates campaign and returns 201', async ({ request }) => {
		if (!templateUuid || !groupUuid) {
			test.skip(true, 'Prerequisite template or group not created')
			return
		}
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: {
				name: `E2E Campaign ${ts}`,
				templateUuid,
				groupUuid,
			},
		})

		expect(resp.status()).toBe(201)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('uuid')
		expect(body.item).toHaveProperty('name', `E2E Campaign ${ts}`)
		expect(body.item).toHaveProperty('slug')
		expect(body.item).toHaveProperty('templateUuid', templateUuid)
		expect(body.item).toHaveProperty('groupUuid', groupUuid)
		expect(body.item).toHaveProperty('status', 'draft')
		createdUuid = body.item.uuid
	})

	test('POST without auth returns 401', async ({ request }) => {
		const resp = await request.post(basePath, {
			data: {
				name: 'Unauth',
				templateUuid: '00000000-0000-0000-0000-000000000000',
				groupUuid: '00000000-0000-0000-0000-000000000000',
			},
		})
		await assertUnauthorized(resp)
	})

	test('POST with missing name returns 400', async ({ request }) => {
		if (!templateUuid || !groupUuid) {
			test.skip(true, 'Prerequisites not available')
			return
		}
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: { templateUuid, groupUuid },
		})
		expect(resp.status()).toBe(400)
		expect(await resp.json()).toEqual({ error: 'Invalid payload' })
	})

	test('POST with missing templateUuid returns 400', async ({ request }) => {
		if (!groupUuid) {
			test.skip(true, 'Prerequisites not available')
			return
		}
		const resp = await request.post(basePath, {
			headers: adminHeaders,
			data: { name: `NoTemplate ${ts + 1}`, groupUuid },
		})
		expect(resp.status()).toBe(400)
		expect(await resp.json()).toEqual({ error: 'Invalid payload' })
	})

	test('GET item by UUID returns 200', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No campaign created')
		const resp = await request.get(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('uuid', createdUuid)
		expect(body.item).toHaveProperty('stats')
	})

	test('GET non-existent UUID returns 404', async ({ request }) => {
		const resp = await request.get(
			`${basePath}/00000000-0000-0000-0000-000000000000`,
			{ headers: adminHeaders },
		)
		expect(resp.status()).toBe(404)
		expect(await resp.json()).toEqual({ error: 'Not found' })
	})

	test('PATCH updates campaign', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No campaign created')
		const resp = await request.patch(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
			data: { name: `Updated Campaign ${ts}` },
		})
		expect(resp.status()).toBe(200)
		const body = await resp.json()
		expect(body).toHaveProperty('item')
		expect(body.item).toHaveProperty('name', `Updated Campaign ${ts}`)
	})

	test('DELETE removes campaign', async ({ request }) => {
		if (!createdUuid) test.skip(true, 'No campaign created')
		const resp = await request.delete(`${basePath}/${createdUuid}`, {
			headers: adminHeaders,
		})
		expect(resp.status()).toBe(200)
		expect(await resp.json()).toEqual({ deleted: true })
	})

	test('DELETE non-existent UUID returns 404', async ({ request }) => {
		const resp = await request.delete(
			`${basePath}/00000000-0000-0000-0000-000000000000`,
			{ headers: adminHeaders },
		)
		expect(resp.status()).toBe(404)
	})

	/* ─── Campaign Run / Retry / Spooler ─── */

	test.describe('Campaign Run — POST /api/admin/email/campaigns/[uuid]/run', () => {
		let runCampaignUuid = ''

		test.beforeAll(async ({ request }) => {
			if (!templateUuid || !groupUuid) return
			const resp = await request.post(basePath, {
				headers: adminHeaders,
				data: {
					name: `RunTest Campaign ${ts}`,
					templateUuid,
					groupUuid,
				},
			})
			if (resp.status() === 201) {
				runCampaignUuid = (await resp.json()).item.uuid
			}
		})

		test.afterAll(async ({ request }) => {
			if (runCampaignUuid) {
				await request.delete(`${basePath}/${runCampaignUuid}`, {
					headers: adminHeaders,
				})
			}
		})

		test('run without auth returns 401', async ({ request }) => {
			const resp = await request.post(
				`${basePath}/00000000-0000-0000-0000-000000000000/run`,
			)
			await assertUnauthorized(resp)
		})

		test('run for non-existent campaign returns 404', async ({ request }) => {
			const resp = await request.post(
				`${basePath}/00000000-0000-0000-0000-000000000000/run`,
				{ headers: adminHeaders },
			)
			expect(resp.status()).toBe(404)
		})

		test('run campaign returns 200 (graceful — may have 0 contacts)', async ({
			request,
		}) => {
			if (!runCampaignUuid) test.skip(true, 'No run-test campaign created')
			const resp = await request.post(`${basePath}/${runCampaignUuid}/run`, {
				headers: adminHeaders,
			})
			// Campaign run returns 200 even with no matching contacts
			// (returns { message: 'No contacts matched', count: 0 })
			// Or 200 with { message: 'Campaign initialized', count: N }
			// Only fails (400/404) if template/group missing or query invalid
			expect(resp.status()).toBe(200)
			const body = await resp.json()
			expect(body).toHaveProperty('message')
			expect(body).toHaveProperty('count')
		})
	})

	test.describe('Campaign Retry — POST /api/admin/email/campaigns/[uuid]/retry', () => {
		test('retry without auth returns 401', async ({ request }) => {
			const resp = await request.post(
				`${basePath}/00000000-0000-0000-0000-000000000000/retry`,
			)
			await assertUnauthorized(resp)
		})

		test('retry returns { retried: count } for any campaign UUID', async ({
			request,
		}) => {
			// Retry is idempotent — returns 200 with retried count (likely 0
			// if no errors)
			const resp = await request.post(
				`${basePath}/00000000-0000-0000-0000-000000000000/retry`,
				{ headers: adminHeaders },
			)
			expect(resp.status()).toBe(200)
			const body = await resp.json()
			expect(body).toHaveProperty('retried')
			expect(typeof body.retried).toBe('number')
		})
	})

	test.describe('Campaign Spooler — GET /api/admin/email/campaigns/[uuid]/spooler', () => {
		test('list spooler without auth returns 401', async ({ request }) => {
			const resp = await request.get(
				`${basePath}/00000000-0000-0000-0000-000000000000/spooler`,
			)
			await assertUnauthorized(resp)
		})

		test('list spooler returns paginated result', async ({ request }) => {
			const resp = await request.get(
				`${basePath}/00000000-0000-0000-0000-000000000000/spooler`,
				{ headers: adminHeaders },
			)
			expect(resp.status()).toBe(200)
			const body = await resp.json()
			expect(body).toHaveProperty('items')
			expect(Array.isArray(body.items)).toBe(true)
			expect(body).toHaveProperty('total')
			expect(body).toHaveProperty('page')
			expect(body).toHaveProperty('limit')
		})

		test('list spooler with status filter', async ({ request }) => {
			const resp = await request.get(
				`${basePath}/00000000-0000-0000-0000-000000000000/spooler?status=new`,
				{ headers: adminHeaders },
			)
			expect(resp.status()).toBe(200)
		})
	})

	test.describe('Campaign Spooler Single — GET .../spooler/[spoolerUuid]', () => {
		test('get without auth returns 401', async ({ request }) => {
			const resp = await request.get(
				`${basePath}/00000000-0000-0000-0000-000000000000/spooler/00000000-0000-0000-0000-000000000000`,
			)
			await assertUnauthorized(resp)
		})

		test('get non-existent spooler entry returns 404', async ({ request }) => {
			const resp = await request.get(
				`${basePath}/00000000-0000-0000-0000-000000000000/spooler/00000000-0000-0000-0000-000000000000`,
				{ headers: adminHeaders },
			)
			expect(resp.status()).toBe(404)
		})
	})

	test.describe('Campaign Spooler Retry — POST .../spooler/[spoolerUuid]/retry', () => {
		test('retry without auth returns 401', async ({ request }) => {
			const resp = await request.post(
				`${basePath}/00000000-0000-0000-0000-000000000000/spooler/00000000-0000-0000-0000-000000000000/retry`,
			)
			await assertUnauthorized(resp)
		})

		test('retry non-existent spooler entry returns 404', async ({
			request,
		}) => {
			const resp = await request.post(
				`${basePath}/00000000-0000-0000-0000-000000000000/spooler/00000000-0000-0000-0000-000000000000/retry`,
				{ headers: adminHeaders },
			)
			expect(resp.status()).toBe(404)
			const body = await resp.json()
			expect(body).toHaveProperty(
				'error',
				'Email not found or not in error state',
			)
		})
	})
})
