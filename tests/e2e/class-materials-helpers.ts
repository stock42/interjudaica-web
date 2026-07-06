import { expect, type APIRequestContext, type APIResponse } from '@playwright/test'
import { createHmac, randomInt, randomUUID } from 'crypto'
import { MongoClient } from 'mongodb'

import { hashPassword } from '../../models/passwords'
import type { TypeUser } from '../../models/users'
import { ADMIN_COOKIE_NAME, STUDENT_COOKIE_NAME, extractCookie } from '../api/setup'

const CSRF_COOKIE = '__Host-interjudaica_csrf'
const CSRF_HEADER = 'x-csrf-token'
const DEVELOPMENT_AUTH_SECRET = 'interjudaica-local-development-secret'

function getAuthSecret(): string {
	return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? DEVELOPMENT_AUTH_SECRET
}

function generateCsrfToken(): string {
	const raw = `${randomInt(100000, 99999999)}-${Date.now()}`
	const hmac = createHmac('sha256', `${getAuthSecret()}-csrf`)
		.update(raw)
		.digest('base64url')

	return `${raw}.${hmac}`
}

function authHeaders(cookieName: string, cookieValue: string, csrf: string) {
	return {
		[CSRF_HEADER]: csrf,
		Cookie: `${CSRF_COOKIE}=${csrf}; ${cookieName}=${cookieValue}`,
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function itemUuidFromBody(body: unknown): string {
	if (isRecord(body) && isRecord(body.item) && typeof body.item.uuid === 'string') {
		return body.item.uuid
	}

	if (isRecord(body) && isRecord(body.user) && typeof body.user.uuid === 'string') {
		return body.user.uuid
	}

	throw new Error('Response body did not include item.uuid')
}

export function itemFieldFromBody(body: unknown, field: string): string {
	if (isRecord(body) && isRecord(body.item) && typeof body.item[field] === 'string') {
		return body.item[field]
	}

	throw new Error(`Response body did not include item.${field}`)
}

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

async function createVerifiedStudent(email: string, password: string): Promise<string> {
	const client = new MongoClient(getMongoUrl())
	await client.connect()

	try {
		const db = client.db(getMongoDbName())
		const uuid = randomUUID()
		const now = new Date()
		const data: TypeUser = {
			uuid,
			email: email.toLowerCase(),
			password: await hashPassword(password),
			firstName: 'Material',
			lastName: 'Student',
			country: 'United States',
			state: 'New York',
			city: 'New York',
			role: 'student',
			status: 'active',
			communityStatus: 'none',
			emailVerificationCode: '',
			emailVerificationExpiresAt: '',
			emailVerifiedAt: now.toISOString(),
			passwordResetCode: '',
			passwordResetExpiresAt: '',
			passwordResetAttempts: 0,
			passwordResetAttemptsWindowStart: '',
			passwordResetLockedUntil: '',
			loginAttempts: 0,
			loginLockedUntil: '',
			emailNotifications: true,
		}

		await db.collection('users').insertOne({
			uuid,
			data,
			_added: now,
			_updated: now,
			_v: 1,
			_n: 0,
		})

		return uuid
	} finally {
		await client.close()
	}
}

export async function loginAsAdmin(request: APIRequestContext) {
	const csrf = generateCsrfToken()
	const response = await request.post('/api/auth/login', {
		headers: {
			[CSRF_HEADER]: csrf,
			Cookie: `${CSRF_COOKIE}=${csrf}`,
		},
		data: {
			email: 'admin@interjudaica.com',
			password: '1NterJuda1c4',
		},
	})

	expect(response.status()).toBe(200)
	return authHeaders(ADMIN_COOKIE_NAME, extractCookie(response, ADMIN_COOKIE_NAME), csrf)
}

export async function registerAndLoginStudent(request: APIRequestContext) {
	const email = `materials_${Date.now()}_${randomUUID().slice(0, 8)}@interjudaica-test.local`
	const password = 'TestPass123!'
	const studentUuid = await createVerifiedStudent(email, password)

	const loginCsrf = generateCsrfToken()
	const loginResponse = await request.post('/api/user-auth/login', {
		headers: {
			[CSRF_HEADER]: loginCsrf,
			Cookie: `${CSRF_COOKIE}=${loginCsrf}`,
		},
		data: { email, password },
	})

	expect(loginResponse.status()).toBe(200)
	return {
		uuid: studentUuid,
		headers: authHeaders(
			STUDENT_COOKIE_NAME,
			extractCookie(loginResponse, STUDENT_COOKIE_NAME),
			loginCsrf,
		),
	}
}

export async function expectJsonOk(response: APIResponse) {
	expect(response.status()).toBeGreaterThanOrEqual(200)
	expect(response.status()).toBeLessThan(300)

	const body: unknown = await response.json()
	return body
}
