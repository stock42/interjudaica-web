/**
 * API Test Helpers — InterJudaica
 *
 * Reusable authentication and utility functions for Playwright API-level tests.
 * Uses the Playwright APIRequestContext fixture for all HTTP calls.
 *
 * IMPORTANT: These helpers assume the dev server is already running on the configured
 * baseURL (default: http://127.0.0.1:3026). The webServer config in playwright.config.ts
 * handles starting the server automatically.
 */

import { type APIRequestContext, type APIResponse } from '@playwright/test'
import { MongoClient } from 'mongodb'

/* ───────── Admin Auth ───────── */

const ADMIN_EMAIL = 'admin@interjudaica.com'
const ADMIN_PASSWORD = '1NterJuda1c4'
export const ADMIN_COOKIE_NAME = '__Host-interjudaica_operator_session'

/**
 * Authenticate as the default admin operator and return the session cookie value.
 * Uses the built-in default operator created by OperatorStorage.ensureDefaultOperator().
 */
export async function loginAsAdmin(request: APIRequestContext): Promise<string> {
  const resp = await request.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })
  if (resp.status() !== 200) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(
      `Admin login failed with status ${resp.status()}: ${JSON.stringify(body)}`
    )
  }
  return extractCookie(resp, ADMIN_COOKIE_NAME)
}

/* ───────── Student Auth ───────── */

export const STUDENT_COOKIE_NAME = '__Host-interjudaica_user_session'

export interface TestStudent {
  email: string
  password: string
  firstName: string
  lastName: string
  uuid?: string
}

let _studentCounter = 0

/**
 * Generate unique test student credentials.
 * Uses a timestamp-based counter to avoid collisions across test runs.
 */
export function createTestStudent(): TestStudent {
  _studentCounter++
  const ts = Date.now()
  const email = `teststudent_${ts}_${_studentCounter}@interjudaica-test.local`
  return {
    email,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: `Student${_studentCounter}`,
  }
}

/**
 * Register a student via the public API.
 * Returns the API response so the caller can inspect status/body.
 */
export async function registerStudent(
  request: APIRequestContext,
  student: TestStudent
): Promise<APIResponse> {
  return request.post('/api/user-auth/register', {
    data: {
      email: student.email,
      password: student.password,
      firstName: student.firstName,
      lastName: student.lastName,
    },
  })
}

/**
 * Login as a student and return the session cookie value.
 * Student must already be registered and verified.
 */
export async function loginAsStudent(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const resp = await request.post('/api/user-auth/login', {
    data: { email, password },
  })
  if (resp.status() !== 200) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(
      `Student login failed with status ${resp.status()}: ${JSON.stringify(body)}`
    )
  }
  return extractCookie(resp, STUDENT_COOKIE_NAME)
}

/* ───────── MongoDB Helpers (for test data management) ───────── */

function getMongoUrl(): string {
  return (
    process.env.MONGODB_URL ??
    process.env.MONGODB_URI ??
    process.env.MONGO_URI ??
    'mongodb://localhost:27017'
  )
}

function getMongoDbName(): string {
  return (
    process.env.MONGODB_NAME ??
    process.env.MONGODB_DATABASE ??
    process.env.MONGO_DB ??
    'interjudaica'
  )
}

let _mongoClient: MongoClient | null = null

async function getMongoClient(): Promise<MongoClient> {
  if (!_mongoClient) {
    _mongoClient = new MongoClient(getMongoUrl())
    await _mongoClient.connect()
  }
  return _mongoClient
}

/**
 * Close the MongoDB connection. Call in global teardown if desired.
 */
export async function closeMongoConnection(): Promise<void> {
  if (_mongoClient) {
    await _mongoClient.close()
    _mongoClient = null
  }
}

/**
 * Get the verification code for a student user from MongoDB.
 * Used to complete the register → verify flow in tests.
 */
export async function getStudentVerificationCode(email: string): Promise<string | null> {
  try {
    const client = await getMongoClient()
    const db = client.db(getMongoDbName())
    const doc = await db.collection('users').findOne({ 'data.email': email.toLowerCase() })
    if (!doc) return null
    return (doc as any).data?.verifyCode ?? null
  } catch {
    return null
  }
}

/**
 * Directly mark a user as verified in MongoDB (bypasses the verify API).
 * Useful for skipping the email verification step in test setup.
 */
export async function markUserVerified(email: string): Promise<boolean> {
  try {
    const client = await getMongoClient()
    const db = client.db(getMongoDbName())
    const result = await db.collection('users').updateOne(
      { 'data.email': email.toLowerCase() },
      {
        $set: {
          'data.status': 'active',
          'data.verified': true,
          'data.verifyCode': null,
          _updated: new Date(),
        },
      }
    )
    return result.modifiedCount > 0
  } catch {
    return false
  }
}

/**
 * Remove test records by UUID from the specified collection.
 * Each record has the shape { uuid, data, _added, ... }.
 */
export async function cleanupTestRecords(
  collectionName: string,
  uuids: string[]
): Promise<number> {
  if (uuids.length === 0) return 0
  try {
    const client = await getMongoClient()
    const db = client.db(getMongoDbName())
    const result = await db
      .collection(collectionName)
      .deleteMany({ uuid: { $in: uuids } })
    return result.deletedCount
  } catch {
    return 0
  }
}

/**
 * Clean up test users by email prefix.
 */
export async function cleanupTestUsers(emailPattern: RegExp): Promise<number> {
  try {
    const client = await getMongoClient()
    const db = client.db(getMongoDbName())
    const result = await db
      .collection('users')
      .deleteMany({ 'data.email': emailPattern })
    return result.deletedCount
  } catch {
    return 0
  }
}

/* ───────── Utility ───────── */

/**
 * Extract a cookie value from a Set-Cookie response header.
 */
export function extractCookie(resp: APIResponse, name: string): string {
  const setCookie = resp.headers()['set-cookie']
  if (!setCookie) return ''
  const match = setCookie.match(new RegExp(`${name}=([^;]+)`))
  return match ? match[1] : ''
}

/**
 * Build a Cookie header from a session cookie value.
 */
export function authHeaders(
  cookieName: string,
  cookieValue: string
): Record<string, string> {
  return { Cookie: `${cookieName}=${cookieValue}` }
}

/**
 * Build admin auth headers from a cookie value.
 */
export function adminAuthHeaders(cookie: string): Record<string, string> {
  return authHeaders(ADMIN_COOKIE_NAME, cookie)
}

/**
 * Build student auth headers from a cookie value.
 */
export function studentAuthHeaders(cookie: string): Record<string, string> {
  return authHeaders(STUDENT_COOKIE_NAME, cookie)
}

/**
 * Assert that a response is a 401 Unauthorized error.
 */
export async function assertUnauthorized(resp: APIResponse): Promise<void> {
  const { expect } = await import('@playwright/test')
  expect(resp.status()).toBe(401)
  const body = await resp.json()
  expect(body).toHaveProperty('error', 'Unauthorized')
}

/**
 * Assert that a response is a 400 Invalid payload error.
 */
export async function assertInvalidPayload(resp: APIResponse): Promise<void> {
  const { expect } = await import('@playwright/test')
  expect(resp.status()).toBe(400)
  const body = await resp.json()
  expect(body).toHaveProperty('error', 'Invalid payload')
}

/* ───────── Full Student Context ───────── */

/**
 * Create a fully authenticated student context.
 * Registers, verifies (via MongoDB), and logs in.
 * Returns the student data and session cookie.
 */
export async function getStudentContext(
  request: APIRequestContext
): Promise<{ student: TestStudent; cookie: string }> {
  const student = createTestStudent()

  // 1. Register
  const regResp = await registerStudent(request, student)
  if (regResp.status() !== 201) {
    throw new Error(
      `Student registration failed: ${regResp.status()} ${await regResp.text()}`
    )
  }

  // 2. Verify — get code from MongoDB and call verify API
  const code = await getStudentVerificationCode(student.email)
  if (code) {
    await request.post('/api/user-auth/verify', {
      data: { email: student.email, code },
    })
  } else {
    // Fallback: directly mark as verified in DB
    await markUserVerified(student.email)
  }

  // 3. Login
  const cookie = await loginAsStudent(request, student.email, student.password)

  return { student, cookie }
}
