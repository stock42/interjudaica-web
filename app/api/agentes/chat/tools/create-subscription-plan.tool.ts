import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { SubscriptionPlanStorage } from '@/services/subscription-plans-storage'
import { billingIntervals } from '@/models/subscription-plans'

// ── createSubscriptionPlan ───────────────────────────────────────────

export const createSubscriptionPlan = tool({
	description:
		'Create a new subscription plan. Required: name, price (in cents). Optional: description, billingInterval (month or year, defaults to month), stripePriceId, active (defaults to true).',
	inputSchema: z.object({
		name: z.string().trim().min(1).max(200).describe('Plan name'),
		description: z.string().trim().default('').describe('Plan description'),
		price: z.number().int().min(0).describe('Price in cents (e.g. 1900 for $19.00)'),
		billingInterval: z.enum(billingIntervals).default('month').describe('Billing interval: month or year'),
		stripePriceId: z.string().trim().default('').nullable().optional().describe('Stripe Price ID'),
		active: z.boolean().default(true).describe('Whether this plan is active'),
	}),
	execute: async (input) => {
		const plan = await SubscriptionPlanStorage.create(input)
		return {
			uuid: plan.uuid,
			name: plan.name,
			description: plan.description,
			price: plan.price,
			billingInterval: plan.billingInterval,
			active: plan.active,
			message: 'Subscription plan created successfully',
		}
	},
})
registerTool('createSubscriptionPlan', { role: 'admin' })
