import { z } from 'zod'
import { createUuid, slugify } from '@/models/model-utils'

export const schemaCrmCampaign = z.object({
	uuid: z.string().uuid().optional(),
	name: z.string().trim().min(2).max(300),
	slug: z.string().trim().optional(),
	description: z.string().trim().default(''),
})

export type TypeCrmCampaign = z.infer<typeof schemaCrmCampaign>

export class CrmCampaignModel {
	private uuid: string
	private campaignData: TypeCrmCampaign

	constructor(props: TypeCrmCampaign) {
		const parsedData = schemaCrmCampaign.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.campaignData = {
			...parsedData,
			uuid: this.uuid,
			slug: slugify(parsedData.name),
		}
	}

	getData(): TypeCrmCampaign {
		return this.campaignData
	}

	getUUID(): string {
		return this.uuid
	}
}
