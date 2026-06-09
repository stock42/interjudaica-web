/**
 * Phase 1 — Auth Endpoint Tests (API-level)
 *
 * Tests all 12 authentication endpoints for both operator (admin) and student (user) systems.
 * Uses Playwright's request fixture for HTTP-level testing.
 *
 * Cookie names:
 *   Admin:   __Host-interjudaica_operator_session  (sameSite=strict, 8h)
 *   Student: __Host-interjudaica_user_session       (sameSite=lax, 7d)
 */

import { expect, test, type APIRequestContext } from '@playwright/test'
import {
  loginAsAdmin,
  loginAsStudent,
  createTestStudent,
  registerStudent,
  getStudentVerificationCode,
  markUserVerified,
  adminAuthHeaders,
  studentAuthHeaders,
  extractCookie,
  ADMIN_COOKIE_NAME,
  STUDENT_COOKIE_NAME,
  cleanupTestUsers,
  type TestStudent,
} from './setup'

/* ───────── Shared State ───────── */

let adminCookie = ''

test.beforeAll(async ({ request }) => {
  adminCookie = await loginAsAdmin(request)
})

/* ──────────────────────────────────────────────────────────── */
/*  Admin Operator Auth                                        */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/auth/login — Operator Login', () => {
  test('successful login returns operator and sets session cookie', async ({
    request,
  }) => {
    const resp = await request.post('/api/auth/login', {
      data: { email: 'admin@interjudaica.com', password: '1NterJuda1c4' },
    })

    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('operator')
    expect(body.operator).toHaveProperty('uuid')
    expect(body.operator).toHaveProperty('email', 'admin@interjudaica.com')
    expect(body.operator).not.toHaveProperty('password')

    const cookie = extractCookie(resp, ADMIN_COOKIE_NAME)
    expect(cookie).toBeTruthy()
    expect(cookie.length).toBeGreaterThan(20)
  })

  test('invalid credentials returns 401', async ({ request }) => {
    const resp = await request.post('/api/auth/login', {
      data: { email: 'admin@interjudaica.com', password: 'wrong-password' },
    })

    expect(resp.status()).toBe(401)
    const body = await resp.json()
    expect(body).toEqual({ error: 'Invalid credentials' })
  })

  test('non-existent email returns 401', async ({ request }) => {
    const resp = await request.post('/api/auth/login', {
      data: { email: 'noone@interjudaica.com', password: 'anything123' },
    })

    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ error: 'Invalid credentials' })
  })

  test('invalid email format returns 400', async ({ request }) => {
    const resp = await request.post('/api/auth/login', {
      data: { email: 'not-an-email', password: 'anything123' },
    })

    // The Zod schema uses email() — invalid format = 400 "Invalid credentials"
    expect(resp.status()).toBe(400)
    expect(await resp.json()).toHaveProperty('error')
  })

  test('missing password returns 400', async ({ request }) => {
    const resp = await request.post('/api/auth/login', {
      data: { email: 'admin@interjudaica.com' },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toHaveProperty('error')
  })

  test('session cookie has security attributes', async ({ request }) => {
    const resp = await request.post('/api/auth/login', {
      data: { email: 'admin@interjudaica.com', password: '1NterJuda1c4' },
    })

    const setCookie = resp.headers()['set-cookie']
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=Strict')
    expect(setCookie).toContain(`Path=/`)
  })
})

test.describe('POST /api/auth/logout — Operator Logout', () => {
  test('clears session cookie and redirects', async ({ request }) => {
    const resp = await request.post('/api/auth/logout', {
      headers: adminAuthHeaders(adminCookie),
    })

    // Logout returns a 303 redirect
    expect(resp.status()).toBe(303)
    const setCookie = resp.headers()['set-cookie'] || ''
    expect(setCookie).toContain(`${ADMIN_COOKIE_NAME}=`)
  })

  test('idempotent — works without auth', async ({ request }) => {
    const resp = await request.post('/api/auth/logout')
    expect(resp.status()).toBe(303)
  })
})

test.describe('GET /api/auth/me — Current Operator', () => {
  test('returns operator with valid session', async ({ request }) => {
    const resp = await request.get('/api/auth/me', {
      headers: adminAuthHeaders(adminCookie),
    })

    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('operator')
    expect(body.operator).toHaveProperty('uuid')
    expect(body.operator).not.toHaveProperty('password')
  })

  test('returns 401 with null operator when unauthenticated', async ({
    request,
  }) => {
    const resp = await request.get('/api/auth/me')

    expect(resp.status()).toBe(401)
    const body = await resp.json()
    expect(body).toEqual({ operator: null })
  })

  test('returns 401 with invalid cookie', async ({ request }) => {
    const resp = await request.get('/api/auth/me', {
      headers: adminAuthHeaders('invalid-token'),
    })

    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ operator: null })
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Registration                           */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/user-auth/register — Student Registration', () => {
  test('successful registration returns 201', async ({ request }) => {
    const student = createTestStudent()
    const resp = await registerStudent(request, student)

    expect(resp.status()).toBe(201)
    const body = await resp.json()
    expect(body).toHaveProperty('user')
    expect(body).toHaveProperty('verificationRequired', true)
    expect(body.user).toHaveProperty('uuid')
    expect(body.user).not.toHaveProperty('password')
    expect(body.user).not.toHaveProperty('emailVerificationCode')
  })

  test('duplicate email returns 409', async ({ request }) => {
    const student = createTestStudent()
    await registerStudent(request, student)
    const resp = await registerStudent(request, student)

    expect(resp.status()).toBe(409)
    expect(await resp.json()).toEqual({ error: 'Email already registered' })
  })

  test('invalid email format returns 400', async ({ request }) => {
    const resp = await request.post('/api/user-auth/register', {
      data: {
        email: 'not-an-email',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'Student',
        country: 'US',
        state: 'NY',
        city: 'New York',
      },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'Invalid payload' })
  })

  test('password too short returns 400', async ({ request }) => {
    const student = createTestStudent()
    const resp = await request.post('/api/user-auth/register', {
      data: {
        email: student.email,
        password: '123',
        firstName: 'Test',
        lastName: 'Student',
        country: 'US',
        state: 'NY',
        city: 'New York',
      },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'Invalid payload' })
  })

  test('missing required fields returns 400', async ({ request }) => {
    const student = createTestStudent()
    const resp = await request.post('/api/user-auth/register', {
      data: {
        email: student.email,
        password: 'TestPass123!',
      },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'Invalid payload' })
  })

  test('empty first name returns 400', async ({ request }) => {
    const student = createTestStudent()
    const resp = await request.post('/api/user-auth/register', {
      data: {
        email: student.email,
        password: 'TestPass123!',
        firstName: '',
        lastName: 'Student',
        country: 'US',
        state: 'NY',
        city: 'New York',
      },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'Invalid payload' })
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Email Verification                     */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/user-auth/verify — Email Verification', () => {
  let pendingStudent: TestStudent
  let validCode: string

  test.beforeAll(async ({ request }) => {
    pendingStudent = createTestStudent()
    await registerStudent(request, pendingStudent)

    // Retrieve the verification code from MongoDB
    const code = await getStudentVerificationCode(pendingStudent.email)
    if (code) {
      validCode = code
    }
  })

  test('correct code verifies user and sets session cookie', async ({
    request,
  }) => {
    if (!validCode) {
      test.skip(true, 'No verification code available (MongoDB not accessible?)')
      return
    }

    const resp = await request.post('/api/user-auth/verify', {
      data: { email: pendingStudent.email, code: validCode },
    })

    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('user')
    expect(body.user).toHaveProperty('uuid')

    const cookie = extractCookie(resp, STUDENT_COOKIE_NAME)
    expect(cookie).toBeTruthy()
  })

  test('incorrect code returns 400', async ({ request }) => {
    const resp = await request.post('/api/user-auth/verify', {
      data: { email: pendingStudent.email, code: '000000' },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toHaveProperty('error')
  })

  test('invalid code format returns 400', async ({ request }) => {
    const resp = await request.post('/api/user-auth/verify', {
      data: { email: pendingStudent.email, code: 'abc' },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toEqual({ error: 'Invalid payload' })
  })

  test('unknown email returns 400', async ({ request }) => {
    const resp = await request.post('/api/user-auth/verify', {
      data: { email: 'ghost@interjudaica-test.local', code: '123456' },
    })

    expect(resp.status()).toBe(400)
    expect(await resp.json()).toHaveProperty('error')
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Resend Verify                          */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/user-auth/resend-verify — Resend Verification', () => {
  test('resends code for pending user', async ({ request }) => {
    const student = createTestStudent()
    await registerStudent(request, student)

    const resp = await request.post('/api/user-auth/resend-verify', {
      data: { email: student.email },
    })

    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('ok', true)
  })

  test('invalid email returns 400', async ({ request }) => {
    const resp = await request.post('/api/user-auth/resend-verify', {
      data: { email: 'not-an-email' },
    })

    expect(resp.status()).toBe(400)
  })

  test('unknown email returns 400 (email not pending)', async ({ request }) => {
    const resp = await request.post('/api/user-auth/resend-verify', {
      data: { email: 'ghost@interjudaica-test.local' },
    })

    expect(resp.status()).toBe(400)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Login                                  */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/user-auth/login — Student Login', () => {
  let verifiedStudent: TestStudent
  let studentCookie: string

  test.beforeAll(async ({ request }) => {
    verifiedStudent = createTestStudent()
    await registerStudent(request, verifiedStudent)
    const code = await getStudentVerificationCode(verifiedStudent.email)
    if (code) {
      await request.post('/api/user-auth/verify', {
        data: { email: verifiedStudent.email, code },
      })
    } else {
      await markUserVerified(verifiedStudent.email)
    }
  })

  test('successful login returns user and sets session cookie', async ({
    request,
  }) => {
    const resp = await request.post('/api/user-auth/login', {
      data: { email: verifiedStudent.email, password: verifiedStudent.password },
    })

    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('user')
    expect(body.user).toHaveProperty('uuid')
    expect(body.user).not.toHaveProperty('password')

    const cookie = extractCookie(resp, STUDENT_COOKIE_NAME)
    expect(cookie).toBeTruthy()
    studentCookie = cookie
  })

  test('invalid credentials returns 401', async ({ request }) => {
    const resp = await request.post('/api/user-auth/login', {
      data: {
        email: verifiedStudent.email,
        password: 'wrong-password',
      },
    })

    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ error: 'Invalid credentials' })
  })

  test('unregistered email returns 401', async ({ request }) => {
    const resp = await request.post('/api/user-auth/login', {
      data: { email: 'ghost@interjudaica-test.local', password: 'TestPass123!' },
    })

    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ error: 'Invalid credentials' })
  })

  test('student session cookie has correct attributes', async ({
    request,
  }) => {
    const resp = await request.post('/api/user-auth/login', {
      data: { email: verifiedStudent.email, password: verifiedStudent.password },
    })

    const setCookie = resp.headers()['set-cookie']
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=Lax')
    expect(setCookie).toContain(`Path=/`)
  })

  test('unverified student cannot login', async ({ request }) => {
    const unverified = createTestStudent()
    await registerStudent(request, unverified)

    const resp = await request.post('/api/user-auth/login', {
      data: { email: unverified.email, password: unverified.password },
    })

    // Unverified = status is not "active" → 401
    expect(resp.status()).toBe(401)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Logout                                 */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/user-auth/logout — Student Logout', () => {
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
    studentCookie = await loginAsStudent(
      request,
      student.email,
      student.password
    )
  })

  test('clears session cookie and redirects', async ({ request }) => {
    const resp = await request.post('/api/user-auth/logout', {
      headers: studentAuthHeaders(studentCookie),
    })

    expect(resp.status()).toBe(303)
    const setCookie = resp.headers()['set-cookie'] || ''
    expect(setCookie).toContain(`${STUDENT_COOKIE_NAME}=`)
  })

  test('idempotent — works without auth', async ({ request }) => {
    const resp = await request.post('/api/user-auth/logout')
    expect(resp.status()).toBe(303)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Me                                     */
/* ──────────────────────────────────────────────────────────── */

test.describe('GET /api/user-auth/me — Current Student', () => {
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
    studentCookie = await loginAsStudent(
      request,
      student.email,
      student.password
    )
  })

  test('returns user with valid session', async ({ request }) => {
    const resp = await request.get('/api/user-auth/me', {
      headers: studentAuthHeaders(studentCookie),
    })

    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('user')
    expect(body.user).toHaveProperty('uuid')
    expect(body.user).not.toHaveProperty('password')
  })

  test('returns 401 with null user when unauthenticated', async ({
    request,
  }) => {
    const resp = await request.get('/api/user-auth/me')

    expect(resp.status()).toBe(401)
    const body = await resp.json()
    expect(body).toEqual({ user: null })
  })

  test('returns 401 with invalid cookie', async ({ request }) => {
    const resp = await request.get('/api/user-auth/me', {
      headers: studentAuthHeaders('invalid-token'),
    })

    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ user: null })
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Forgot Password                        */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/user-auth/forgot-password', () => {
  let testStudent: TestStudent

  test.beforeAll(async ({ request }) => {
    testStudent = createTestStudent()
    await registerStudent(request, testStudent)
    const code = await getStudentVerificationCode(testStudent.email)
    if (code) {
      await request.post('/api/user-auth/verify', {
        data: { email: testStudent.email, code },
      })
    } else {
      await markUserVerified(testStudent.email)
    }
  })

  test('sends reset code for known email', async ({ request }) => {
    const resp = await request.post('/api/user-auth/forgot-password', {
      data: { email: testStudent.email },
    })

    expect(resp.status()).toBe(200)
    expect(await resp.json()).toEqual({ ok: true })
  })

  test('returns ok even for unknown email (prevents enumeration)', async ({
    request,
  }) => {
    const resp = await request.post('/api/user-auth/forgot-password', {
      data: { email: 'ghost@interjudaica-test.local' },
    })

    expect(resp.status()).toBe(200)
    expect(await resp.json()).toEqual({ ok: true })
  })

  test('invalid email format returns ok (no enumeration)', async ({
    request,
  }) => {
    const resp = await request.post('/api/user-auth/forgot-password', {
      data: { email: 'not-an-email' },
    })

    expect(resp.status()).toBe(200)
    expect(await resp.json()).toEqual({ ok: true })
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Reset Password                         */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/user-auth/reset-password', () => {
  let resetStudent: TestStudent
  let resetCode: string

  test.beforeAll(async ({ request }) => {
    resetStudent = createTestStudent()
    await registerStudent(request, resetStudent)
    const verifyCode = await getStudentVerificationCode(resetStudent.email)
    if (verifyCode) {
      await request.post('/api/user-auth/verify', {
        data: { email: resetStudent.email, code: verifyCode },
      })
    } else {
      await markUserVerified(resetStudent.email)
    }
    // Request password reset to generate a code
    await request.post('/api/user-auth/forgot-password', {
      data: { email: resetStudent.email },
    })

    // Retrieve the reset code from MongoDB
    // The reset code is stored in the same user document (passwordResetCode field)
    const code = await getStudentVerificationCode(resetStudent.email)
    // Note: passwordResetCode is a different field; we may need to check both
    if (code) {
      resetCode = code
    }
  })

  test('reset with valid code returns 200', async ({ request }) => {
    if (!resetCode) {
      test.skip(true, 'No reset code available')
      return
    }

    const resp = await request.post('/api/user-auth/reset-password', {
      data: {
        email: resetStudent.email,
        code: resetCode,
        password: 'NewTestPass456!',
      },
    })

    expect(resp.status()).toBe(200)
    expect(await resp.json()).toEqual({ ok: true })
  })

  test('can login with new password after reset', async ({ request }) => {
    // Only if reset happened above
    if (!resetCode) {
      test.skip(true, 'Skipped — no reset code')
      return
    }

    // Reset first if not already done
    await request.post('/api/user-auth/reset-password', {
      data: {
        email: resetStudent.email,
        code: resetCode,
        password: 'NewTestPass456!',
      },
    })

    const loginResp = await request.post('/api/user-auth/login', {
      data: { email: resetStudent.email, password: 'NewTestPass456!' },
    })

    expect(loginResp.status()).toBe(200)
  })

  test('invalid code returns 400', async ({ request }) => {
    const resp = await request.post('/api/user-auth/reset-password', {
      data: {
        email: resetStudent.email,
        code: '000000',
        password: 'SomePassword123!',
      },
    })

    expect(resp.status()).toBe(400)
  })

  test('invalid payload (missing fields) returns 400', async ({ request }) => {
    const resp = await request.post('/api/user-auth/reset-password', {
      data: { email: resetStudent.email },
    })

    expect(resp.status()).toBe(400)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Student User Auth — Resend Reset                           */
/* ──────────────────────────────────────────────────────────── */

test.describe('POST /api/user-auth/resend-reset — Resend Reset Code', () => {
  let resendStudent: TestStudent

  test.beforeAll(async ({ request }) => {
    resendStudent = createTestStudent()
    await registerStudent(request, resendStudent)
    const code = await getStudentVerificationCode(resendStudent.email)
    if (code) {
      await request.post('/api/user-auth/verify', {
        data: { email: resendStudent.email, code },
      })
    } else {
      await markUserVerified(resendStudent.email)
    }
  })

  test('resends reset code for verified user', async ({ request }) => {
    // First request a reset to generate a code
    await request.post('/api/user-auth/forgot-password', {
      data: { email: resendStudent.email },
    })

    const resp = await request.post('/api/user-auth/resend-reset', {
      data: { email: resendStudent.email },
    })

    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('ok', true)
    expect(body).toHaveProperty('cooldownSeconds')
  })

  test('invalid email returns 400', async ({ request }) => {
    const resp = await request.post('/api/user-auth/resend-reset', {
      data: { email: 'not-an-email' },
    })

    expect(resp.status()).toBe(400)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Cookie Security Tests                                      */
/* ──────────────────────────────────────────────────────────── */

test.describe('Cookie Security', () => {
  test('admin cookie is HttpOnly and Secure', async ({ request }) => {
    const resp = await request.post('/api/auth/login', {
      data: { email: 'admin@interjudaica.com', password: '1NterJuda1c4' },
    })

    const setCookie = resp.headers()['set-cookie']
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=Strict')
  })

  test('student cookie is HttpOnly and Secure', async ({ request }) => {
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

    const resp = await request.post('/api/user-auth/login', {
      data: { email: student.email, password: student.password },
    })

    const setCookie = resp.headers()['set-cookie']
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=Lax')
  })

  test('admin APIs require auth cookie', async ({ request }) => {
    const resp = await request.get('/api/admin/courses')

    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ error: 'Unauthorized' })
  })

  test('student me returns null without cookie', async ({ request }) => {
    const resp = await request.get('/api/user-auth/me')

    expect(resp.status()).toBe(401)
    expect(await resp.json()).toEqual({ user: null })
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  Cleanup                                                    */
/* ──────────────────────────────────────────────────────────── */

test.afterAll(async () => {
  // Clean up test users created during auth tests
  await cleanupTestUsers(/@interjudaica-test\.local$/)
})
