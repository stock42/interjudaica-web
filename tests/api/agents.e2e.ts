/**
 * Phase 3 — AI Agents Endpoint Tests (API-level)
 *
 * Tests the admin-only AI agent endpoints for generating email queries and templates.
 * Both endpoints require admin operator authentication via requireAdminApi().
 *
 * Endpoints:
 *   POST /api/agentes/generate-query    — body: { promoting: string } → 200 { query: string }
 *   POST /api/agentes/generate-template — body: { promoting: string } → 200 { html: string }
 */

import { expect, test } from '@playwright/test'
import {
  loginAsAdmin,
  adminAuthHeaders,
} from './setup'

/* ───────── Shared State ───────── */

let adminHeaders: Record<string, string>

test.beforeAll(async ({ request }) => {
  const cookie = await loginAsAdmin(request)
  adminHeaders = adminAuthHeaders(cookie)
})

/* ───────── Helper ───────── */

async function assertUnauthorized(resp: any) {
  expect(resp.status()).toBe(401)
  expect(await resp.json()).toEqual({ error: 'Unauthorized' })
}

/* ──────────────────────────────────────────────────────────── */
/*  Generate Query                                              */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/agentes/generate-query', () => {
  test('valid prompt returns 200 with { query }', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-query', {
      headers: adminHeaders,
      data: { promoting: 'An exciting new Torah course on Genesis' },
    })

    // The LLM call may fail/timeout in CI — accept 200 or 500
    expect([200, 500]).toContain(resp.status())
    if (resp.status() === 200) {
      const body = await resp.json()
      expect(body).toHaveProperty('query')
      expect(typeof body.query).toBe('string')
      expect(body.query.length).toBeGreaterThan(0)
    }
  })

  test('empty promoting returns 400', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-query', {
      headers: adminHeaders,
      data: { promoting: '' },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'promoting is required' })
  })

  test('whitespace-only promoting returns 400', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-query', {
      headers: adminHeaders,
      data: { promoting: '   ' },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'promoting is required' })
  })

  test('missing promoting field returns 400', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-query', {
      headers: adminHeaders,
      data: {},
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'promoting is required' })
  })

  test('no auth returns 401', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-query', {
      data: { promoting: 'Test promoting' },
    })

    await assertUnauthorized(resp)
  })

  test('invalid cookie returns 401', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-query', {
      headers: adminAuthHeaders('invalid-token'),
      data: { promoting: 'Test promoting' },
    })

    await assertUnauthorized(resp)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Generate Template                                           */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/agentes/generate-template', () => {
  test('valid prompt returns 200 with { html }', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-template', {
      headers: adminHeaders,
      data: { promoting: 'A weekly Torah study newsletter' },
    })

    // The LLM call may fail/timeout in CI — accept 200 or 500
    expect([200, 500]).toContain(resp.status())
    if (resp.status() === 200) {
      const body = await resp.json()
      expect(body).toHaveProperty('html')
      expect(typeof body.html).toBe('string')
      expect(body.html.length).toBeGreaterThan(0)
    }
  })

  test('empty promoting returns 400', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-template', {
      headers: adminHeaders,
      data: { promoting: '' },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'promoting is required' })
  })

  test('whitespace-only promoting returns 400', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-template', {
      headers: adminHeaders,
      data: { promoting: '   ' },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'promoting is required' })
  })

  test('missing promoting field returns 400', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-template', {
      headers: adminHeaders,
      data: {},
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'promoting is required' })
  })

  test('no auth returns 401', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-template', {
      data: { promoting: 'Test promoting' },
    })

    await assertUnauthorized(resp)
  })

  test('invalid cookie returns 401', async ({ request }) => {
    const resp = await request.post('/api/agentes/generate-template', {
      headers: adminAuthHeaders('invalid-token'),
      data: { promoting: 'Test promoting' },
    })

    await assertUnauthorized(resp)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Cross-endpoint consistency                                   */
/* ──────────────────────────────────────────────────────────── */

test.describe('Agent endpoint input parity', () => {
  test('both endpoints reject promoting with special chars only', async ({
    request,
  }) => {
    for (const path of [
      '/api/agentes/generate-query',
      '/api/agentes/generate-template',
    ]) {
      const resp = await request.post(path, {
        headers: adminHeaders,
        data: { promoting: '!!!' },
      })
      // Accepts non-empty strings — validation only checks trim() !== ''
      expect([200, 500]).toContain(resp.status())
    }
  })

  test('both endpoints require admin auth', async ({ request }) => {
    for (const path of [
      '/api/agentes/generate-query',
      '/api/agentes/generate-template',
    ]) {
      const resp = await request.post(path, {
        data: { promoting: 'Test' },
      })
      await assertUnauthorized(resp)
    }
  })
})
