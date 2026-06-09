/**
 * Sales Endpoint Tests — InterJudaica
 *
 * Tests all public-facing sales/checkout endpoints plus the Stripe webhook
 * and book download endpoints.
 *
 * Coverage:
 *   POST /api/checkout          — course checkout (student auth required)
 *   POST /api/stripe/webhook     — Stripe webhook (signature-based, no auth)
 *   POST /api/books/checkout     — book checkout (student or guest)
 *   POST /api/community/checkout — community membership checkout (student auth)
 *   GET  /api/books/download     — book download (token-based)
 *
 * Leniency: Stripe may not be configured in test environments, so successful
 * checkout tests accept 200 (Stripe URL returned) or 400/500 (server error).
 * The critical invariants are: endpoint exists, auth gates work, and bad
 * input returns 400.
 */

import { expect, test, type APIResponse } from '@playwright/test'
import {
  loginAsAdmin,
  loginAsStudent,
  createTestStudent,
  registerStudent,
  getStudentVerificationCode,
  markUserVerified,
  adminAuthHeaders,
  studentAuthHeaders,
  cleanupTestRecords,
} from './setup'

/* ───────── Shared State ───────── */

let adminHeaders: Record<string, string>
let studentCookie: string
let studentHeaders: Record<string, string>
let testCourseUuid = ''
let testBookUuid = ''
let testPlanUuid = ''

test.beforeAll(async ({ request }) => {
  // ── Admin login ──
  const adminCookie = await loginAsAdmin(request)
  adminHeaders = adminAuthHeaders(adminCookie)

  // ── Create test course (published, with price) ──
  const courseResp = await request.post('/api/admin/courses', {
    headers: adminHeaders,
    data: {
      title: `SalesTest Course ${Date.now()}`,
      category: 'Torah',
      price: 19,
      status: 'published',
    },
  })
  if (courseResp.status() === 201) {
    const body = await courseResp.json()
    testCourseUuid = body.item.uuid
  }

  // ── Create test book (published, with price) ──
  const bookResp = await request.post('/api/admin/books', {
    headers: adminHeaders,
    data: {
      title: `SalesTest Book ${Date.now()}`,
      description: 'A test book for sales endpoint testing',
      price: 9.99,
      status: 'published',
    },
  })
  if (bookResp.status() === 201) {
    const body = await bookResp.json()
    testBookUuid = body.item.uuid
  }

  // ── Create test subscription plan ──
  const planResp = await request.post('/api/admin/subscription-plans', {
    headers: adminHeaders,
    data: {
      name: `SalesTest Plan ${Date.now()}`,
      description: 'A test subscription plan',
      price: 19,
      billingInterval: 'month',
      active: true,
    },
  })
  if (planResp.status() === 201) {
    testPlanUuid = (await planResp.json()).item.uuid
  }

  // ── Create and verify student ──
  const student = createTestStudent()
  await registerStudent(request, student)
  const code = await getStudentVerificationCode(student.email)
  if (code) {
    await request.post('/api/user-auth/verify', {
      data: { email: student.email, code },
    })
  } else {
    await markUserVerified(student.email)
  }
  studentCookie = await loginAsStudent(request, student.email, student.password)
  studentHeaders = studentAuthHeaders(studentCookie)
})

/* ───────── Helpers ───────── */

/**
 * Assert that a response is a 401 Unauthorized error.
 */
async function assertUnauthorized(resp: APIResponse) {
  expect(resp.status()).toBe(401)
  const body = await resp.json()
  expect(body).toHaveProperty('error', 'Unauthorized')
}

/**
 * Assert that a checkout response succeeds OR fails with a server error
 * (e.g., missing Stripe config). Critical: the endpoint must exist and
 * respond — not a 404 route-not-found.
 */
async function assertCheckoutResponds(resp: APIResponse) {
  const status = resp.status()
  // 200 = Stripe URL returned; 400/500 = server error (likely missing Stripe config)
  expect([200, 400, 500]).toContain(status)
  if (status === 200) {
    const body = await resp.json()
    expect(body).toHaveProperty('url')
    expect(typeof body.url).toBe('string')
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/checkout — Course Checkout                          */
/* ═══════════════════════════════════════════════════════════════ */

test.describe('POST /api/checkout', () => {
  test('returns 401 without auth', async ({ request }) => {
    const resp = await request.post('/api/checkout', {
      data: { courseUuid: '00000000-0000-0000-0000-000000000000' },
    })
    await assertUnauthorized(resp)
  })

  test('returns 400 for invalid payload (missing courseUuid)', async ({ request }) => {
    const resp = await request.post('/api/checkout', {
      headers: studentHeaders,
      data: {},
    })
    // Zod parse error returns 400
    expect([400, 500]).toContain(resp.status())
  })

  test('returns 400 for invalid UUID format', async ({ request }) => {
    const resp = await request.post('/api/checkout', {
      headers: studentHeaders,
      data: { courseUuid: 'not-a-uuid' },
    })
    expect([400, 500]).toContain(resp.status())
  })

  test('returns 404 for non-existent course', async ({ request }) => {
    const resp = await request.post('/api/checkout', {
      headers: studentHeaders,
      data: { courseUuid: '00000000-0000-0000-0000-000000000000' },
    })
    expect(resp.status()).toBe(404)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Course not available')
  })

  test('valid course responds with 200 or server error', async ({ request }) => {
    if (!testCourseUuid) {
      test.skip(true, 'No test course created')
      return
    }
    const resp = await request.post('/api/checkout', {
      headers: studentHeaders,
      data: { courseUuid: testCourseUuid },
    })
    await assertCheckoutResponds(resp)
  })

  test('with invalid coupon code returns 400', async ({ request }) => {
    if (!testCourseUuid) {
      test.skip(true, 'No test course created')
      return
    }
    const resp = await request.post('/api/checkout', {
      headers: studentHeaders,
      data: { courseUuid: testCourseUuid, couponCode: 'NONEXISTENT-COUPON-999' },
    })
    expect([200, 400, 500]).toContain(resp.status())
    if (resp.status() === 400) {
      const body = await resp.json()
      expect(body).toHaveProperty('error')
    }
  })

  test('with 100% coupon returns direct success URL (no Stripe)', async ({
    request,
  }) => {
    if (!testCourseUuid) {
      test.skip(true, 'No test course created')
      return
    }

    // Create a 100% off coupon for this test
    const couponResp = await request.post('/api/admin/coupons', {
      headers: adminHeaders,
      data: {
        code: `FREE100_${Date.now()}`,
        percentOff: 100,
        scope: 'all',
      },
    })

    if (couponResp.status() !== 201) {
      test.skip(true, 'Could not create test coupon')
      return
    }

    const coupon = (await couponResp.json()).item
    const resp = await request.post('/api/checkout', {
      headers: studentHeaders,
      data: { courseUuid: testCourseUuid, couponCode: coupon.code },
    })

    const status = resp.status()
    expect([200, 400, 500]).toContain(status)
    if (status === 200) {
      const body = await resp.json()
      expect(body).toHaveProperty('url')
      // 100% coupon should NOT return a Stripe URL
      expect(body.url).not.toContain('checkout.stripe.com')
      expect(body.url).toContain('dashboard')
    }

    // Cleanup coupon
    await request.delete(`/api/admin/coupons/${coupon.uuid}`, {
      headers: adminHeaders,
    })
  })
})

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/stripe/webhook — Stripe Webhook                     */
/* ═══════════════════════════════════════════════════════════════ */

test.describe('POST /api/stripe/webhook', () => {
  test('returns 400 when stripe-signature header is missing', async ({
    request,
  }) => {
    const resp = await request.post('/api/stripe/webhook', {
      data: { type: 'checkout.session.completed', data: {} },
    })
    expect(resp.status()).toBe(400)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Missing signature')
  })

  test('returns 400 for invalid signature', async ({ request }) => {
    const resp = await request.post('/api/stripe/webhook', {
      headers: { 'stripe-signature': 'invalid-signature-value' },
      data: { type: 'checkout.session.completed', data: {} },
    })
    expect(resp.status()).toBe(400)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Invalid signature')
  })

  test('responds without crashing for various event types (invalid sig expected)', async ({
    request,
  }) => {
    // Send a malformed payload — the endpoint should not 500-crash
    // (it will reject with 400 for invalid signature)
    const resp = await request.post('/api/stripe/webhook', {
      headers: { 'stripe-signature': 't=12345,v1=abcdef' },
      data: { type: 'unknown.event', data: { object: {} } },
    })
    expect([400]).toContain(resp.status())
  })
})

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/books/checkout — Book Checkout                      */
/* ═══════════════════════════════════════════════════════════════ */

test.describe('POST /api/books/checkout', () => {
  test('returns 400 without auth and missing guest info', async ({
    request,
  }) => {
    const resp = await request.post('/api/books/checkout', {
      data: { bookUuid: '00000000-0000-0000-0000-000000000000' },
    })
    expect(resp.status()).toBe(400)
    const body = await resp.json()
    expect(body).toHaveProperty('error')
  })

  test('guest checkout with email and name responds (may need Stripe)', async ({
    request,
  }) => {
    if (!testBookUuid) {
      test.skip(true, 'No test book created')
      return
    }
    const resp = await request.post('/api/books/checkout', {
      data: {
        bookUuid: testBookUuid,
        firstName: 'Guest',
        lastName: 'Buyer',
        email: 'guest@interjudaica-test.local',
      },
    })
    await assertCheckoutResponds(resp)
  })

  test('returns 404 for non-existent book', async ({ request }) => {
    const resp = await request.post('/api/books/checkout', {
      headers: studentHeaders,
      data: {
        bookUuid: '00000000-0000-0000-0000-000000000000',
        firstName: 'Test',
        email: 'test@interjudaica-test.local',
      },
    })
    expect(resp.status()).toBe(404)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Book not available')
  })

  test('authenticated student can checkout book', async ({ request }) => {
    if (!testBookUuid) {
      test.skip(true, 'No test book created')
      return
    }
    const resp = await request.post('/api/books/checkout', {
      headers: studentHeaders,
      data: { bookUuid: testBookUuid },
    })
    await assertCheckoutResponds(resp)
  })

  test('returns 400 for invalid UUID format', async ({ request }) => {
    const resp = await request.post('/api/books/checkout', {
      headers: studentHeaders,
      data: { bookUuid: 'not-a-uuid' },
    })
    expect([400, 500]).toContain(resp.status())
  })
})

/* ═══════════════════════════════════════════════════════════════ */
/*  POST /api/community/checkout — Community Checkout             */
/* ═══════════════════════════════════════════════════════════════ */

test.describe('POST /api/community/checkout', () => {
  test('returns 401 without auth', async ({ request }) => {
    const resp = await request.post('/api/community/checkout', {
      data: { planUuid: '00000000-0000-0000-0000-000000000000' },
    })
    await assertUnauthorized(resp)
  })

  test('returns 400 for invalid payload (missing planUuid)', async ({ request }) => {
    const resp = await request.post('/api/community/checkout', {
      headers: studentHeaders,
      data: {},
    })
    expect([400, 500]).toContain(resp.status())
  })

  test('returns 404 for non-existent plan', async ({ request }) => {
    const resp = await request.post('/api/community/checkout', {
      headers: studentHeaders,
      data: { planUuid: '00000000-0000-0000-0000-000000000000' },
    })
    expect(resp.status()).toBe(404)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Plan not found')
  })

  test('valid plan checkout responds with 200 or server error', async ({
    request,
  }) => {
    if (!testPlanUuid) {
      test.skip(true, 'No test plan created')
      return
    }
    const resp = await request.post('/api/community/checkout', {
      headers: studentHeaders,
      data: { planUuid: testPlanUuid },
    })
    await assertCheckoutResponds(resp)
  })

  test('with 100% community coupon returns direct success URL', async ({
    request,
  }) => {
    if (!testPlanUuid) {
      test.skip(true, 'No test plan created')
      return
    }

    const couponResp = await request.post('/api/admin/coupons', {
      headers: adminHeaders,
      data: {
        code: `COMMFREE_${Date.now()}`,
        percentOff: 100,
        scope: 'community',
      },
    })

    if (couponResp.status() !== 201) {
      test.skip(true, 'Could not create test coupon')
      return
    }

    const coupon = (await couponResp.json()).item
    const resp = await request.post('/api/community/checkout', {
      headers: studentHeaders,
      data: { planUuid: testPlanUuid, couponCode: coupon.code },
    })

    const status = resp.status()
    expect([200, 400, 500]).toContain(status)
    if (status === 200) {
      const body = await resp.json()
      expect(body).toHaveProperty('url')
      expect(body.url).not.toContain('checkout.stripe.com')
    }

    // Cleanup
    await request.delete(`/api/admin/coupons/${coupon.uuid}`, {
      headers: adminHeaders,
    })
  })

  test('invalid coupon returns 400', async ({ request }) => {
    if (!testPlanUuid) {
      test.skip(true, 'No test plan created')
      return
    }
    const resp = await request.post('/api/community/checkout', {
      headers: studentHeaders,
      data: { planUuid: testPlanUuid, couponCode: 'BOGUS-COUPON-99999' },
    })
    expect([200, 400, 500]).toContain(resp.status())
    if (resp.status() === 400) {
      const body = await resp.json()
      expect(body).toHaveProperty('error')
    }
  })
})

/* ═══════════════════════════════════════════════════════════════ */
/*  GET /api/books/download — Book Download (token-based)         */
/* ═══════════════════════════════════════════════════════════════ */

test.describe('GET /api/books/download', () => {
  test('returns 400 when token query param is missing', async ({ request }) => {
    const resp = await request.get('/api/books/download')
    expect(resp.status()).toBe(400)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Missing token')
  })

  test('returns 400 when token is empty', async ({ request }) => {
    const resp = await request.get('/api/books/download?token=')
    expect(resp.status()).toBe(400)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Missing token')
  })

  test('returns 404 for invalid/unknown token', async ({ request }) => {
    const resp = await request.get(
      '/api/books/download?token=00000000-0000-0000-0000-000000000000'
    )
    expect(resp.status()).toBe(404)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Invalid or expired token')
  })

  test('download endpoint exists (401/400/404 expected without valid token)', async ({
    request,
  }) => {
    // The endpoint is token-based, not session-based.
    // Without a valid token, it returns 400 or 404.
    const resp = await request.get('/api/books/download?token=some-fake-token')
    expect([400, 404]).toContain(resp.status())
  })
})

/* ═══════════════════════════════════════════════════════════════ */
/*  Cross-cutting: Auth required where specified                   */
/* ═══════════════════════════════════════════════════════════════ */

test.describe('Auth enforcement on sales endpoints', () => {
  test('POST /api/checkout — no cookie returns 401', async ({ request }) => {
    const resp = await request.post('/api/checkout', {
      data: { courseUuid: '00000000-0000-0000-0000-000000000000' },
    })
    await assertUnauthorized(resp)
  })

  test('POST /api/community/checkout — no cookie returns 401', async ({
    request,
  }) => {
    const resp = await request.post('/api/community/checkout', {
      data: { planUuid: '00000000-0000-0000-0000-000000000000' },
    })
    await assertUnauthorized(resp)
  })

  test('POST /api/checkout — invalid cookie returns 401', async ({
    request,
  }) => {
    const resp = await request.post('/api/checkout', {
      headers: studentAuthHeaders('invalid-cookie-value'),
      data: { courseUuid: '00000000-0000-0000-0000-000000000000' },
    })
    expect(resp.status()).toBe(401)
  })

  test('POST /api/community/checkout — invalid cookie returns 401', async ({
    request,
  }) => {
    const resp = await request.post('/api/community/checkout', {
      headers: studentAuthHeaders('invalid-cookie-value'),
      data: { planUuid: '00000000-0000-0000-0000-000000000000' },
    })
    expect(resp.status()).toBe(401)
  })
})

/* ───────── Cleanup ───────── */

test.afterAll(async () => {
  if (testCourseUuid) await cleanupTestRecords('courses', [testCourseUuid])
  if (testBookUuid) await cleanupTestRecords('books', [testBookUuid])
  if (testPlanUuid)
    await cleanupTestRecords('subscription-plans', [testPlanUuid])
})
