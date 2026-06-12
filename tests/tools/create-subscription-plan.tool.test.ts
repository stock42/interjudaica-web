import { beforeAll, describe, expect, mock, test } from 'bun:test'

// Track registered tools for verification
const registeredTools = new Map<string, { role: string; needsApproval?: boolean }>()

mock.module('server-only', () => ({}))

mock.module('@/lib/llm-tool-auth', () => ({
	registerTool: (name: string, config: { role: string; needsApproval?: boolean }) => {
		registeredTools.set(name, config)
	},
}))

// ── Mock storage service ────────────────────────────────────────────

const mockPlans: Array<Record<string, unknown>> = []

function resetStorage() {
	mockPlans.length = 0
}

mock.module('@/services/subscription-plans-storage', () => ({
	SubscriptionPlanStorage: {
		create: (input: Record<string, unknown>) => {
			const plan = {
				uuid: 'plan-' + (mockPlans.length + 1),
				name: input.name,
				description: input.description || '',
				price: input.price,
				billingInterval: input.billingInterval || 'month',
				active: input.active !== undefined ? input.active : true,
			}
			mockPlans.push(plan)
			return Promise.resolve(plan)
		},
	},
}))

// ── Mock billing intervals ──────────────────────────────────────────

mock.module('@/models/subscription-plans', () => ({
	billingIntervals: ['month', 'year'],
}))

// ── Import tool after mocks are set ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createSubscriptionPlan: any

beforeAll(async () => {
	const mod = await import(
		'@/app/api/agentes/chat/tools/create-subscription-plan.tool'
	)
	createSubscriptionPlan = mod.createSubscriptionPlan
})

// ── Tests ──────────────────────────────────────────────────────────

describe('create-subscription-plan.tool', () => {
	describe('tool registration', () => {
		test('registers createSubscriptionPlan with admin role', () => {
			expect(registeredTools.has('createSubscriptionPlan')).toBe(true)
			expect(
				registeredTools.get('createSubscriptionPlan')?.role,
			).toBe('admin')
		})

		test('createSubscriptionPlan does not require approval', () => {
			expect(
				registeredTools.get('createSubscriptionPlan')?.needsApproval,
			).toBeFalsy()
		})
	})

	describe('createSubscriptionPlan', () => {
		test('creates plan with required fields only', async () => {
			resetStorage()
			const result = (await createSubscriptionPlan.execute({
				name: 'Community Monthly',
				price: 1900,
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.name).toBe('Community Monthly')
			expect(result.price).toBe(1900)
			expect(result.billingInterval).toBe('month')
			expect(result.active).toBe(true)
			expect(result.description).toBe('')
			expect(result.message).toBe('Subscription plan created successfully')
		})

		test('creates plan with all optional fields', async () => {
			resetStorage()
			const result = (await createSubscriptionPlan.execute({
				name: 'Community Yearly',
				description: 'Full year of community access',
				price: 19000,
				billingInterval: 'year',
				stripePriceId: 'price_abc123',
				active: false,
			})) as Record<string, unknown>

			expect(result.name).toBe('Community Yearly')
			expect(result.description).toBe('Full year of community access')
			expect(result.price).toBe(19000)
			expect(result.billingInterval).toBe('year')
			expect(result.active).toBe(false)
		})

		test('defaults billingInterval to month', async () => {
			resetStorage()
			const result = (await createSubscriptionPlan.execute({
				name: 'Basic Monthly',
				price: 500,
			})) as Record<string, unknown>

			expect(result.billingInterval).toBe('month')
		})

		test('defaults active to true', async () => {
			resetStorage()
			const result = (await createSubscriptionPlan.execute({
				name: 'Auto-Active Plan',
				price: 999,
			})) as Record<string, unknown>

			expect(result.active).toBe(true)
		})

		test('accepts zero-price plan', async () => {
			resetStorage()
			const result = (await createSubscriptionPlan.execute({
				name: 'Free Tier',
				price: 0,
				description: 'Free community access',
			})) as Record<string, unknown>

			expect(result.price).toBe(0)
			expect(result.name).toBe('Free Tier')
		})
	})
})
