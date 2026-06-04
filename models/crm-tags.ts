import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const schemaCrmTag = z.object({
	uuid: z.string().uuid().optional(),
	name: z
		.string()
		.trim()
		.min(1)
		.transform((n) => n.toLowerCase()),
})

export type TypeCrmTag = z.infer<typeof schemaCrmTag>

export class CrmTagModel {
	private uuid: string
	private tagData: TypeCrmTag

	constructor(props: TypeCrmTag) {
		const parsedData = schemaCrmTag.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.tagData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeCrmTag {
		return this.tagData
	}

	getUUID(): string {
		return this.uuid
	}
}
