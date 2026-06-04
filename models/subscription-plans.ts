import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const billingIntervals = ['month', 'year'] as const

export const schemaSubscriptionPlan = z.object({
	uuid: z.string().uuid().optional(),
	name: z.string().trim().min(1).max(200),
	description: z.string().trim().default(''),
	price: z.coerce.number().int().min(0),
	billingInterval: z.enum(billingIntervals).default('month'),
	stripePriceId: z.string().trim().default('').nullable().optional(),
	active: z.coerce.boolean().default(true),
})

export type TypeSubscriptionPlan = z.infer<typeof schemaSubscriptionPlan>

export class SubscriptionPlanModel {
	private uuid: string
	private planData: TypeSubscriptionPlan

	constructor(props: TypeSubscriptionPlan) {
		const parsedData = schemaSubscriptionPlan.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.planData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeSubscriptionPlan {
		return this.planData
	}

	getUUID(): string {
		return this.uuid
	}
}
