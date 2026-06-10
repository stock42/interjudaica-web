import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { filterToolResult } from '@/lib/llm-pii-guard'
import { schemaOperatorCreate, schemaOperatorUpdate } from '@/models/operators'
import { OperatorStorage } from '@/services/operators-storage'
import { UserStorage } from '@/services/users-storage'

// ── Helper: safe user fields allowed in update tool ─────────────────

const schemaUserUpdateFields = z.object({
	email: z
		.string()
		.email()
		.max(320)
		.transform((e) => e.toLowerCase())
		.optional()
		.describe('User email'),
	firstName: z.string().trim().max(100).optional().describe('First name'),
	lastName: z.string().trim().max(100).optional().describe('Last name'),
	country: z.string().trim().max(100).optional().describe('Country'),
	state: z.string().trim().max(100).optional().describe('State/province'),
	city: z.string().trim().max(100).optional().describe('City'),
	role: z.string().trim().optional().describe('User role'),
	status: z
		.enum(['active', 'disabled', 'pending'])
		.optional()
		.describe('Account status'),
	communityStatus: z
		.enum(['none', 'active', 'cancelled', 'manual'])
		.optional()
		.describe('Community membership status'),
	emailNotifications: z
		.coerce
		.boolean()
		.optional()
		.describe('Email notification preference'),
})

// ── listUsers ───────────────────────────────────────────────────────

export const listUsers = tool({
	description:
		'List all users in the platform. Returns safe user data — passwords, verification codes, and security fields are never exposed.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await UserStorage.list()
		return filterToolResult('listUsers', { count: items.length, users: items })
	},
})
registerTool('listUsers', { role: 'admin' })

// ── getUser ─────────────────────────────────────────────────────────

export const getUser = tool({
	description:
		'Get a single user by UUID. Returns safe profile data — no passwords or verification codes.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the user to retrieve'),
	}),
	execute: async ({ uuid }) => {
		const user = await UserStorage.get(uuid)
		if (!user) {
			return { error: 'User not found' }
		}
		return filterToolResult('getUser', user)
	},
})
registerTool('getUser', { role: 'admin' })

// ── updateUser ──────────────────────────────────────────────────────

export const updateUser = tool({
	description:
		'Update a user profile by UUID. Only the fields provided will be updated. Cannot change passwords or verification codes — those must be managed through the auth flow.',
	inputSchema: schemaUserUpdateFields.extend({
		uuid: z.string().uuid().describe('The UUID of the user to update'),
	}),
	execute: async ({ uuid, ...updates }) => {
		const updated = await UserStorage.update(uuid, updates)
		if (!updated) {
			return { error: 'User not found' }
		}
		return filterToolResult('updateUser', {
			...updated,
			message: 'User updated successfully',
		})
	},
})
registerTool('updateUser', { role: 'admin' })

// ── deleteUser ──────────────────────────────────────────────────────

export const deleteUser = tool({
	description:
		'Delete a user permanently by UUID. This action cannot be undone. ⚠️ Requires operator approval before execution.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the user to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await UserStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'User not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteUser', { role: 'admin', needsApproval: true })

// ── listOperators ───────────────────────────────────────────────────

export const listOperators = tool({
	description:
		'List all operators (admin users) in the platform. Returns safe operator data — passwords and security fields are never exposed.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await OperatorStorage.list()
		return filterToolResult('listOperators', {
			count: items.length,
			operators: items,
		})
	},
})
registerTool('listOperators', { role: 'admin' })

// ── createOperator ──────────────────────────────────────────────────

export const createOperator = tool({
	description:
		'Create a new operator (admin user). Requires email, password (min 8 chars), and permission level (1–50).',
	inputSchema: schemaOperatorCreate,
	execute: async (input) => {
		const operator = await OperatorStorage.create(input)
		return filterToolResult('createOperator', {
			...operator,
			message: 'Operator created successfully',
		})
	},
})
registerTool('createOperator', { role: 'admin' })

// ── updateOperator ──────────────────────────────────────────────────

export const updateOperator = tool({
	description:
		'Update an existing operator by UUID. Only the fields provided will be updated. Password can be changed by providing a new password string.',
	inputSchema: schemaOperatorUpdate.extend({
		uuid: z.string().uuid().describe('The UUID of the operator to update'),
	}),
	execute: async ({ uuid, ...updates }) => {
		const updated = await OperatorStorage.update(uuid, updates)
		if (!updated) {
			return { error: 'Operator not found' }
		}
		return filterToolResult('updateOperator', {
			...updated,
			message: 'Operator updated successfully',
		})
	},
})
registerTool('updateOperator', { role: 'admin' })

// ── deleteOperator ──────────────────────────────────────────────────

export const deleteOperator = tool({
	description:
		'Delete an operator permanently by UUID. This action cannot be undone. ⚠️ Requires operator approval before execution.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the operator to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await OperatorStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Operator not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteOperator', { role: 'admin', needsApproval: true })
