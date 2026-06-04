import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const schemaCrmCampaignContact = z.object({
	uuid: z.string().uuid().optional(),
	campaignUuid: z.string().uuid(),
	contactUuid: z.string().uuid(),
	status: z.string().trim().default(''),
})

export const schemaCrmCampaignContactUpdate = z.object({
	status: z.string().trim().default(''),
})

export type TypeCrmCampaignContact = z.infer<typeof schemaCrmCampaignContact>
export type TypeCrmCampaignContactUpdate = z.infer<
	typeof schemaCrmCampaignContactUpdate
>

export class CrmCampaignContactModel {
	private uuid: string
	private linkData: TypeCrmCampaignContact

	constructor(props: TypeCrmCampaignContact) {
		const parsedData = schemaCrmCampaignContact.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.linkData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeCrmCampaignContact {
		return this.linkData
	}

	getUUID(): string {
		return this.uuid
	}
}
