import { z } from 'zod'
import { createUuid, slugify } from '@/models/model-utils'

export const emailCampaignStatuses = ['draft', 'running', 'done'] as const

export const schemaEmailCampaign = z.object({
	uuid: z.string().uuid().optional(),
	name: z.string().trim().min(2).max(300),
	slug: z.string().trim().optional(),
	templateUuid: z.string().uuid(),
	groupUuid: z.string().uuid(),
	deliveryTime: z.string().trim().nullable().default(null),
	status: z.enum(emailCampaignStatuses).default('draft'),
})

export type TypeEmailCampaign = z.infer<typeof schemaEmailCampaign>

export class EmailCampaignModel {
	private uuid: string
	private campaignData: TypeEmailCampaign

	constructor(props: TypeEmailCampaign) {
		const parsedData = schemaEmailCampaign.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.campaignData = {
			...parsedData,
			uuid: this.uuid,
			slug: slugify(parsedData.name),
		}
	}

	getData(): TypeEmailCampaign {
		return this.campaignData
	}

	getUUID(): string {
		return this.uuid
	}
}
