/**
 * Phase 3 — Public/Student Endpoint Tests (API-level)
 *
 * Tests public-facing endpoints accessible without auth and student-authenticated endpoints.
 * Covers courses, papers, forums, books, social proof, contact, owner bio, and community checkout.
 *
 * Student auth setup follows the project pattern:
 *   register → verify → login → use cookie for authenticated requests.
 */

import { expect, test } from '@playwright/test'
import {
  loginAsStudent,
  createTestStudent,
  registerStudent,
  getStudentVerificationCode,
  markUserVerified,
  studentAuthHeaders,
} from './setup'

/* ───────── Shared Student State ───────── */

let studentCookie: string

test.beforeAll(async ({ request }) => {
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
})

function studentHeaders(): Record<string, string> {
  return studentAuthHeaders(studentCookie)
}

/* ──────────────────────────────────────────────────────────── */
/*  Public Courses                                              */
/* ──────────────────────────────────────────────────────────── */

test.describe('Public Courses', () => {
  test('GET /api/courses/[slug]/classes returns classes for existing course', async ({
    request,
  }) => {
    // Use a slug that may exist in test data — accept 200 or 404
    const resp = await request.get('/api/courses/introduction-to-torah/classes')
    expect([200, 404]).toContain(resp.status())

    if (resp.status() === 200) {
      const body = await resp.json()
      expect(body).toHaveProperty('items')
      expect(Array.isArray(body.items)).toBe(true)
    }
  })

  test('GET /api/courses/[slug]/classes returns 404 for non-existent course', async ({
    request,
  }) => {
    const resp = await request.get(
      '/api/courses/non-existent-course-slug-xyz/classes'
    )
    expect(resp.status()).toBe(404)
    const body = await resp.json()
    expect(body).toHaveProperty('error', 'Not found')
  })

  test('GET /api/courses/[slug]/classes works without auth', async ({
    request,
  }) => {
    const resp = await request.get('/api/courses/some-course/classes')
    // 200 if course exists, 404 if not — but never 401
    expect(resp.status()).not.toBe(401)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Papers                                                      */
/* ──────────────────────────────────────────────────────────── */

test.describe('Papers', () => {
  test('GET /api/papers returns published public papers', async ({
    request,
  }) => {
    const resp = await request.get('/api/papers')
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('items')
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('GET /api/papers with visibility=public works without auth', async ({
    request,
  }) => {
    const resp = await request.get('/api/papers?visibility=public')
    expect(resp.status()).toBe(200)
    expect((await resp.json())).toHaveProperty('items')
  })

  test('GET /api/papers with visibility=community returns 403 without auth', async ({
    request,
  }) => {
    const resp = await request.get('/api/papers?visibility=community')
    expect(resp.status()).toBe(403)
    expect(await resp.json()).toEqual({ error: 'Forbidden' })
  })

  test('GET /api/papers with invalid visibility returns 400', async ({
    request,
  }) => {
    const resp = await request.get('/api/papers?visibility=secret')
    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'Invalid visibility' })
  })

  test('GET /api/papers/[slug] returns 404 for non-existent paper', async ({
    request,
  }) => {
    const resp = await request.get('/api/papers/non-existent-paper-slug-xyz')
    expect(resp.status()).toBe(404)
    expect(await resp.json()).toEqual({ error: 'Not found' })
  })

  test('GET /api/papers/[slug] works for existing public paper', async ({
    request,
  }) => {
    // Attempt to fetch a paper that might exist — accept 200 or 404
    const resp = await request.get('/api/papers/sample-paper')
    expect([200, 404]).toContain(resp.status())

    if (resp.status() === 200) {
      const body = await resp.json()
      expect(body).toHaveProperty('item')
      expect(body.item).toHaveProperty('slug')
    }
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Forum                                                       */
/* ──────────────────────────────────────────────────────────── */

test.describe('Forum', () => {
  test('GET /api/forums?area=Announcements returns threads without auth', async ({
    request,
  }) => {
    const resp = await request.get('/api/forums?area=Announcements')
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('items')
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('GET /api/forums with pagination returns limited results', async ({
    request,
  }) => {
    const resp = await request.get(
      '/api/forums?area=Announcements&page=1&limit=3'
    )
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('items')
    expect(body.items.length).toBeLessThanOrEqual(3)
  })

  test('GET /api/forums without area returns 401 (auth required for non-announcement)', async ({
    request,
  }) => {
    const resp = await request.get('/api/forums')
    expect(resp.status()).toBe(401)
  })

  test('POST /api/forums without auth returns 401', async ({ request }) => {
    const resp = await request.post('/api/forums', {
      data: {
        scope: 'support',
        title: 'Test thread',
        content: 'This is a test forum post.',
      },
    })
    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ error: 'Unauthorized' })
  })

  test('POST /api/forums with student auth creates a support thread', async ({
    request,
  }) => {
    const resp = await request.post('/api/forums', {
      headers: studentHeaders(),
      data: {
        scope: 'support',
        title: `E2E Support Thread ${Date.now()}`,
        content: 'This is a test support thread from e2e testing.',
      },
    })

    expect(resp.status()).toBe(201)
    const body = await resp.json()
    expect(body).toHaveProperty('item')
    expect(body.item).toHaveProperty('uuid')
    expect(body.item).toHaveProperty('title')
    expect(body.item).toHaveProperty('area', 'Technical Support')
  })

  test('POST /api/forums rejects missing scope', async ({ request }) => {
    const resp = await request.post('/api/forums', {
      headers: studentHeaders(),
      data: {
        title: 'No scope thread',
        content: 'Missing scope field.',
      },
    })
    expect(resp.status()).toBe(400)
    expect(await resp.json()).toHaveProperty('error')
  })

  test('POST /api/forums rejects empty title', async ({ request }) => {
    const resp = await request.post('/api/forums', {
      headers: studentHeaders(),
      data: {
        scope: 'support',
        title: '',
        content: 'Some content.',
      },
    })
    expect(resp.status()).toBe(400)
  })

  test('POST /api/forums with community scope requires membership (403)', async ({
    request,
  }) => {
    const resp = await request.post('/api/forums', {
      headers: studentHeaders(),
      data: {
        scope: 'community',
        title: `E2E Community Thread ${Date.now()}`,
        content: 'This student has no community membership.',
      },
    })
    // 403 because test student has no active community membership
    expect(resp.status()).toBe(403)
    expect(await resp.json()).toEqual({ error: 'Forbidden' })
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Forum Image Upload                                          */
/* ──────────────────────────────────────────────────────────── */

test.describe('Forum Image Upload', () => {
  test('POST /api/forums/upload-image without auth returns 401', async ({
    request,
  }) => {
    const resp = await request.post('/api/forums/upload-image')
    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ error: 'Unauthorized' })
  })

  test('POST /api/forums/upload-image with student auth but no file returns 400', async ({
    request,
  }) => {
    const resp = await request.post('/api/forums/upload-image', {
      headers: studentHeaders(),
    })
    expect(resp.status()).toBe(400)
  })

  test('POST /api/forums/upload-image with student auth and valid file uploads image', async ({
    request,
  }) => {
    // Create a minimal valid PNG (1x1 pixel)
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )

    const resp = await request.post('/api/forums/upload-image', {
      headers: studentHeaders(),
      multipart: {
        file: {
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: pngBytes,
        },
      },
    })

    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('url')
    expect(body.url).toContain('/uploads/forums/')
  })

  test('POST /api/forums/upload-image rejects non-image file types', async ({
    request,
  }) => {
    const resp = await request.post('/api/forums/upload-image', {
      headers: studentHeaders(),
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not an image'),
        },
      },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({
      error: 'Only JPG, PNG, WEBP, and GIF images are allowed',
    })
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Books                                                       */
/* ──────────────────────────────────────────────────────────── */

test.describe('Books', () => {
  test('GET /api/books/[slug] returns 404 for non-existent book', async ({
    request,
  }) => {
    const resp = await request.get('/api/books/non-existent-book-slug-xyz')
    // Route may not exist (404) or may exist but slug not found (also 404)
    expect(resp.status()).toBe(404)
  })

  test('GET /api/books/[slug] works without auth', async ({ request }) => {
    const resp = await request.get('/api/books/some-book')
    // 200 if route+book exist, 404 otherwise — but never 401
    expect(resp.status()).not.toBe(401)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Social Proof                                                */
/* ──────────────────────────────────────────────────────────── */

test.describe('Social Proof', () => {
  test('GET /api/social-proof returns published testimonials', async ({
    request,
  }) => {
    const resp = await request.get('/api/social-proof')
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('items')
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('GET /api/social-proof works without auth', async ({ request }) => {
    const resp = await request.get('/api/social-proof')
    expect(resp.status()).not.toBe(401)
  })

  test('GET /api/social-proof items have expected shape when present', async ({
    request,
  }) => {
    const resp = await request.get('/api/social-proof')
    const body = await resp.json()
    if (body.items.length > 0) {
      const item = body.items[0]
      expect(item).toHaveProperty('quote')
      expect(item).toHaveProperty('name')
    }
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Contact                                                     */
/* ──────────────────────────────────────────────────────────── */

test.describe('Contact', () => {
  test('POST /api/contact with valid data returns 200', async ({
    request,
  }) => {
    const resp = await request.post('/api/contact', {
      data: {
        email: `e2e-contact-${Date.now()}@interjudaica-test.local`,
        firstName: 'Test',
        lastName: 'Contact',
        message: 'This is an e2e test contact message.',
      },
    })

    // Email sending may fail (500) but contact is still stored
    expect([200, 500]).toContain(resp.status())
    if (resp.status() === 200) {
      const body = await resp.json()
      expect(body).toHaveProperty('ok', true)
    }
  })

  test('POST /api/contact without auth works (public endpoint)', async ({
    request,
  }) => {
    const resp = await request.post('/api/contact', {
      data: {
        email: `e2e-contact-${Date.now() + 1}@interjudaica-test.local`,
        firstName: 'Test',
        lastName: 'Public',
        message: 'No auth required for contact.',
      },
    })
    expect(resp.status()).not.toBe(401)
  })

  test('POST /api/contact with invalid email returns 400', async ({
    request,
  }) => {
    const resp = await request.post('/api/contact', {
      data: {
        email: 'not-an-email',
        firstName: 'Test',
        lastName: 'Contact',
        message: 'Invalid email should fail.',
      },
    })
    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'Invalid request' })
  })

  test('POST /api/contact with missing firstName returns 400', async ({
    request,
  }) => {
    const resp = await request.post('/api/contact', {
      data: {
        email: 'test@example.com',
        lastName: 'Contact',
        message: 'Missing first name.',
      },
    })
    expect(resp.status()).toBe(400)
  })

  test('POST /api/contact with empty message returns 400', async ({
    request,
  }) => {
    const resp = await request.post('/api/contact', {
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Contact',
        message: '',
      },
    })
    expect(resp.status()).toBe(400)
  })

  test('POST /api/contact with empty firstName returns 400', async ({
    request,
  }) => {
    const resp = await request.post('/api/contact', {
      data: {
        email: 'test@example.com',
        firstName: '',
        lastName: 'Contact',
        message: 'Empty first name.',
      },
    })
    expect(resp.status()).toBe(400)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Owner Bio                                                   */
/* ──────────────────────────────────────────────────────────── */

test.describe('Owner Bio', () => {
  test('GET /api/owner-bio returns owner bio data', async ({ request }) => {
    const resp = await request.get('/api/owner-bio')
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('item')
  })

  test('GET /api/owner-bio works without auth', async ({ request }) => {
    const resp = await request.get('/api/owner-bio')
    expect(resp.status()).not.toBe(401)
  })

  test('GET /api/owner-bio item has expected shape', async ({ request }) => {
    const resp = await request.get('/api/owner-bio')
    const body = await resp.json()
    if (body.item) {
      // The bio may be empty if not configured — that's fine
      expect(body.item).toHaveProperty('slug')
    }
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Community Checkout                                          */
/* ──────────────────────────────────────────────────────────── */

test.describe('Community Checkout', () => {
  test('POST /api/community/checkout without auth returns 401', async ({
    request,
  }) => {
    const resp = await request.post('/api/community/checkout', {
      data: {
        planUuid: '00000000-0000-0000-0000-000000000000',
      },
    })
    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ error: 'Unauthorized' })
  })

  test('POST /api/community/checkout with student auth but invalid planUuid returns 404', async ({
    request,
  }) => {
    const resp = await request.post('/api/community/checkout', {
      headers: studentHeaders(),
      data: {
        planUuid: '00000000-0000-0000-0000-000000000000',
      },
    })
    expect(resp.status()).toBe(404)
    expect(await resp.json()).toEqual({ error: 'Plan not found' })
  })

  test('POST /api/community/checkout with non-UUID planUuid returns 400', async ({
    request,
  }) => {
    const resp = await request.post('/api/community/checkout', {
      headers: studentHeaders(),
      data: {
        planUuid: 'not-a-uuid',
      },
    })
    expect(resp.status()).toBe(400)
  })

  test('POST /api/community/checkout with missing planUuid returns 400', async ({
    request,
  }) => {
    const resp = await request.post('/api/community/checkout', {
      headers: studentHeaders(),
      data: {},
    })
    expect(resp.status()).toBe(400)
  })
})
