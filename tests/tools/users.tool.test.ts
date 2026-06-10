import { beforeAll, describe, expect, mock, test } from 'bun:test'

// Track registered tools for verification
const registeredTools = new Map<string, { role: string; needsApproval?: boolean }>()

mock.module('server-only', () => ({}))

mock.module('@/lib/llm-tool-auth', () => ({
	registerTool: (name: string, config: { role: string; needsApproval?: boolean }) => {
		registeredTools.set(name, config)
	},
}))

// ── Mock storage services ──────────────────────────────────────────

const mockUsers: Array<Record<string, unknown>> = []
const mockOperators: Array<Record<string, unknown>> = []

function resetStorage() {
	mockUsers.length = 0
	mockOperators.length = 0
}

mock.module('@/services/users-storage', () => ({
	UserStorage: {
		list: () => Promise.resolve([...mockUsers]),
		get: (uuid: string) => {
			const found = mockUsers.find((u) => u.uuid === uuid)
			return Promise.resolve(found ?? null)
		},
		update: (uuid: string, input: Record<string, unknown>) => {
			const idx = mockUsers.findIndex((u) => u.uuid === uuid)
			if (idx === -1) return Promise.resolve(null)
			mockUsers[idx] = { ...mockUsers[idx], ...input }
			return Promise.resolve(mockUsers[idx])
		},
		delete: (uuid: string) => {
			const idx = mockUsers.findIndex((u) => u.uuid === uuid)
			if (idx === -1) return Promise.resolve(0)
			mockUsers.splice(idx, 1)
			return Promise.resolve(1)
		},
	},
}))

mock.module('@/services/operators-storage', () => ({
	OperatorStorage: {
		list: () => Promise.resolve([...mockOperators]),
		get: (uuid: string) => {
			const found = mockOperators.find((o) => o.uuid === uuid)
			return Promise.resolve(found ?? null)
		},
		create: (input: Record<string, unknown>) => {
			const operator = {
				uuid: 'op-' + (mockOperators.length + 1),
				email: input.email,
				firstName: input.firstName ?? null,
				lastName: input.lastName ?? null,
				enabled: input.enabled ?? true,
				level: input.level ?? 50,
			}
			mockOperators.push(operator)
			return Promise.resolve(operator)
		},
		update: (uuid: string, input: Record<string, unknown>) => {
			const idx = mockOperators.findIndex((o) => o.uuid === uuid)
			if (idx === -1) return Promise.resolve(null)
			mockOperators[idx] = { ...mockOperators[idx], ...input }
			return Promise.resolve(mockOperators[idx])
		},
		delete: (uuid: string) => {
			const idx = mockOperators.findIndex((o) => o.uuid === uuid)
			if (idx === -1) return Promise.resolve(0)
			mockOperators.splice(idx, 1)
			return Promise.resolve(1)
		},
	},
}))

// ── Import tools after mocks are set ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let listUsers: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getUser: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let updateUser: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deleteUser: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let listOperators: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createOperator: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let updateOperator: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deleteOperator: any

beforeAll(async () => {
	const mod = await import('@/app/api/agentes/chat/tools/users.tool')
	listUsers = mod.listUsers
	getUser = mod.getUser
	updateUser = mod.updateUser
	deleteUser = mod.deleteUser
	listOperators = mod.listOperators
	createOperator = mod.createOperator
	updateOperator = mod.updateOperator
	deleteOperator = mod.deleteOperator
})

// ── Helper: create a mock user with sensitive fields ───────────────

function makeMockUser(overrides: Record<string, unknown> = {}) {
	return {
		uuid: '550e8400-e29b-41d4-a716-446655440000',
		email: 'user@example.com',
		firstName: 'Test',
		lastName: 'User',
		country: 'US',
		state: 'NY',
		city: 'New York',
		role: 'student',
		status: 'active',
		communityStatus: 'none',
		// Sensitive fields — should be stripped by filterToolResult
		password: '$scrypt$...',
		emailVerificationCode: '123456',
		emailVerificationExpiresAt: '2026-01-01T00:00:00.000Z',
		emailVerifiedAt: '2026-01-01T00:00:00.000Z',
		passwordResetCode: '654321',
		passwordResetExpiresAt: '2026-01-01T00:00:00.000Z',
		passwordResetAttempts: 0,
		passwordResetAttemptsWindowStart: '',
		passwordResetLockedUntil: '',
		passwordChangedAt: '2026-01-01T00:00:00.000Z',
		loginAttempts: 0,
		loginLockedUntil: '',
		...overrides,
	}
}

// ── Helper: create a mock operator with sensitive fields ───────────

function makeMockOperator(overrides: Record<string, unknown> = {}) {
	return {
		uuid: '660e8400-e29b-41d4-a716-446655440001',
		email: 'admin@example.com',
		firstName: 'Admin',
		lastName: 'Operator',
		enabled: true,
		level: 50,
		// Sensitive fields — should be stripped by filterToolResult
		password: '$scrypt$...',
		verifyCode: '789012',
		passwordChangedAt: '2026-01-01T00:00:00.000Z',
		loginAttempts: 0,
		loginLockedUntil: '',
		...overrides,
	}
}

// ── Tests ──────────────────────────────────────────────────────────

describe('users.tool', () => {
	describe('tool registration', () => {
		test('registers all 8 tools with admin role', () => {
			const expectedTools = [
				'listUsers',
				'getUser',
				'updateUser',
				'deleteUser',
				'listOperators',
				'createOperator',
				'updateOperator',
				'deleteOperator',
			]

			for (const name of expectedTools) {
				expect(registeredTools.has(name)).toBe(true)
				expect(registeredTools.get(name)?.role).toBe('admin')
			}
		})

		test('deleteUser has needsApproval: true', () => {
			expect(registeredTools.get('deleteUser')?.needsApproval).toBe(true)
		})

		test('deleteOperator has needsApproval: true', () => {
			expect(registeredTools.get('deleteOperator')?.needsApproval).toBe(true)
		})

		test('non-destructive tools do not require approval', () => {
			const nonDestructive = [
				'listUsers',
				'getUser',
				'updateUser',
				'listOperators',
				'createOperator',
				'updateOperator',
			]
			for (const name of nonDestructive) {
				expect(registeredTools.get(name)?.needsApproval).toBeFalsy()
			}
		})
	})

	// ── User tools ──────────────────────────────────────────────────

	describe('listUsers', () => {
		test('returns empty list when no users exist', async () => {
			resetStorage()
			const result = (await listUsers.execute({})) as {
				count: number
				users: unknown[]
			}
			expect(result.count).toBe(0)
			expect(result.users).toEqual([])
		})

		test('returns user data with sensitive fields redacted', async () => {
			resetStorage()
			mockUsers.push(
				makeMockUser({
					uuid: 'user-1',
					email: 'alice@example.com',
					password: '$scrypt$alice-hash',
					emailVerificationCode: '111111',
				}),
				makeMockUser({
					uuid: 'user-2',
					email: 'bob@example.com',
					password: '$scrypt$bob-hash',
					passwordResetCode: '222222',
				}),
			)

			const result = (await listUsers.execute({})) as {
				count: number
				users: Array<Record<string, unknown>>
			}
			expect(result.count).toBe(2)

			const alice = result.users.find((u) => u.email === 'alice@example.com')!
			const bob = result.users.find((u) => u.email === 'bob@example.com')!

			// Safe fields are preserved
			expect(alice.uuid).toBe('user-1')
			expect(alice.email).toBe('alice@example.com')
			expect(alice.firstName).toBe('Test')

			// Sensitive fields are redacted (defense-in-depth via filterToolResult)
			expect(alice.password).toBe('[REDACTED]')
			expect(alice.emailVerificationCode).toBe('[REDACTED]')
			expect(alice.passwordResetCode).toBe('[REDACTED]')
			expect(alice.loginAttempts).toBe('[REDACTED]')
			expect(alice.loginLockedUntil).toBe('[REDACTED]')
			expect(alice.passwordChangedAt).toBe('[REDACTED]')

			expect(bob.password).toBe('[REDACTED]')
			expect(bob.passwordResetCode).toBe('[REDACTED]')
		})
	})

	describe('getUser', () => {
		test('returns safe user data for existing user', async () => {
			resetStorage()
			mockUsers.push(
				makeMockUser({
					uuid: 'user-1',
					email: 'charlie@example.com',
					password: '$scrypt$secret',
					passwordResetCode: '999999',
				}),
			)

			const result = (await getUser.execute({ uuid: 'user-1' })) as Record<string, unknown>

			// Safe fields preserved
			expect(result.uuid).toBe('user-1')
			expect(result.email).toBe('charlie@example.com')

			// Sensitive fields redacted
			expect(result.password).toBe('[REDACTED]')
			expect(result.passwordResetCode).toBe('[REDACTED]')
		})

		test('returns error for non-existent user', async () => {
			resetStorage()
			const result = (await getUser.execute({
				uuid: '00000000-0000-0000-0000-000000000000',
			})) as Record<string, unknown>
			expect(result.error).toBe('User not found')
		})
	})

	describe('updateUser', () => {
		test('updates safe profile fields', async () => {
			resetStorage()
			mockUsers.push(
				makeMockUser({ uuid: 'user-1', firstName: 'Old', lastName: 'Name' }),
			)

			const result = (await updateUser.execute({
				uuid: 'user-1',
				firstName: 'NewFirst',
				lastName: 'NewLast',
			})) as Record<string, unknown>

			expect(result.uuid).toBe('user-1')
			expect(result.firstName).toBe('NewFirst')
			expect(result.lastName).toBe('NewLast')
			expect(result.message).toBe('User updated successfully')

			// Sensitive fields still redacted in output
			expect(result.password).toBe('[REDACTED]')
		})

		test('returns error for non-existent user', async () => {
			resetStorage()
			const result = (await updateUser.execute({
				uuid: '00000000-0000-0000-0000-000000000000',
				firstName: 'Ghost',
			})) as Record<string, unknown>
			expect(result.error).toBe('User not found')
		})

		test('can update status and role', async () => {
			resetStorage()
			mockUsers.push(
				makeMockUser({ uuid: 'user-1', status: 'active', role: 'student' }),
			)

			const result = (await updateUser.execute({
				uuid: 'user-1',
				status: 'disabled',
				role: 'student',
			})) as Record<string, unknown>

			expect(result.status).toBe('disabled')
		})
	})

	describe('deleteUser', () => {
		test('deletes an existing user', async () => {
			resetStorage()
			mockUsers.push(makeMockUser({ uuid: 'user-1', email: 'bye@example.com' }))
			const result = (await deleteUser.execute({ uuid: 'user-1' })) as Record<
				string,
				unknown
			>
			expect(result.deleted).toBe(true)
			expect(result.uuid).toBe('user-1')
			expect(mockUsers.length).toBe(0)
		})

		test('returns error for non-existent user', async () => {
			resetStorage()
			const result = (await deleteUser.execute({
				uuid: '00000000-0000-0000-0000-000000000000',
			})) as Record<string, unknown>
			expect(result.error).toBe('User not found')
		})
	})

	// ── Operator tools ──────────────────────────────────────────────

	describe('listOperators', () => {
		test('returns empty list when no operators exist', async () => {
			resetStorage()
			const result = (await listOperators.execute({})) as {
				count: number
				operators: unknown[]
			}
			expect(result.count).toBe(0)
			expect(result.operators).toEqual([])
		})

		test('returns operator data with sensitive fields redacted', async () => {
			resetStorage()
			mockOperators.push(
				makeMockOperator({
					uuid: 'op-1',
					email: 'admin1@example.com',
					password: '$scrypt$admin-hash',
					verifyCode: '123456',
				}),
				makeMockOperator({
					uuid: 'op-2',
					email: 'admin2@example.com',
					password: '$scrypt$admin2-hash',
				}),
			)

			const result = (await listOperators.execute({})) as {
				count: number
				operators: Array<Record<string, unknown>>
			}
			expect(result.count).toBe(2)

			const op1 = result.operators.find((o) => o.email === 'admin1@example.com')!

			// Safe fields preserved
			expect(op1.uuid).toBe('op-1')
			expect(op1.email).toBe('admin1@example.com')
			expect(op1.level).toBe(50)

			// Sensitive fields redacted
			expect(op1.password).toBe('[REDACTED]')
			expect(op1.verifyCode).toBe('[REDACTED]')
			expect(op1.passwordChangedAt).toBe('[REDACTED]')
			expect(op1.loginAttempts).toBe('[REDACTED]')
		})
	})

	describe('createOperator', () => {
		test('creates a new operator with required fields', async () => {
			resetStorage()
			const result = (await createOperator.execute({
				email: 'newadmin@example.com',
				password: 'securePassword123',
				level: 50,
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.email).toBe('newadmin@example.com')
			expect(result.level).toBe(50)
			expect(result.message).toBe('Operator created successfully')

			// Password and verifyCode must NOT appear in output
			expect(result.password).toBeUndefined()
			expect(result.verifyCode).toBeUndefined()

			// Verify operator was added to storage
			expect(mockOperators.length).toBe(1)
			expect(mockOperators[0]!.email).toBe('newadmin@example.com')
		})

		test('creates operator with all optional fields', async () => {
			resetStorage()
			const result = (await createOperator.execute({
				email: 'fulladmin@example.com',
				password: 'securePassword123',
				firstName: 'Full',
				lastName: 'Admin',
				enabled: false,
				level: 25,
			})) as Record<string, unknown>

			expect(result.firstName).toBe('Full')
			expect(result.lastName).toBe('Admin')
			expect(result.enabled).toBe(false)
			expect(result.level).toBe(25)
		})
	})

	describe('updateOperator', () => {
		test('updates an existing operator', async () => {
			resetStorage()
			mockOperators.push(
				makeMockOperator({
					uuid: 'op-1',
					email: 'old@example.com',
					firstName: 'Old',
				}),
			)

			const result = (await updateOperator.execute({
				uuid: 'op-1',
				firstName: 'Updated',
				enabled: false,
			})) as Record<string, unknown>

			expect(result.firstName).toBe('Updated')
			expect(result.enabled).toBe(false)
			expect(result.message).toBe('Operator updated successfully')

			// Sensitive fields still redacted
			expect(result.password).toBe('[REDACTED]')
		})

		test('returns error for non-existent operator', async () => {
			resetStorage()
			const result = (await updateOperator.execute({
				uuid: '00000000-0000-0000-0000-000000000000',
				firstName: 'Ghost',
			})) as Record<string, unknown>
			expect(result.error).toBe('Operator not found')
		})
	})

	describe('deleteOperator', () => {
		test('deletes an existing operator', async () => {
			resetStorage()
			mockOperators.push(makeMockOperator({ uuid: 'op-1', email: 'bye@example.com' }))
			const result = (await deleteOperator.execute({ uuid: 'op-1' })) as Record<
				string,
				unknown
			>
			expect(result.deleted).toBe(true)
			expect(result.uuid).toBe('op-1')
			expect(mockOperators.length).toBe(0)
		})

		test('returns error for non-existent operator', async () => {
			resetStorage()
			const result = (await deleteOperator.execute({
				uuid: '00000000-0000-0000-0000-000000000000',
			})) as Record<string, unknown>
			expect(result.error).toBe('Operator not found')
		})
	})
})
