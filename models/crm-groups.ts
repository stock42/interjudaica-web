import { z } from 'zod'
import { createUuid, slugify } from '@/models/model-utils'

export const schemaCrmGroup = z.object({
	uuid: z.string().uuid().optional(),
	name: z.string().trim().min(2).max(300),
	slug: z.string().trim().optional(),
	description: z.string().trim().default(''),
	query: z
		.string()
		.trim()
		.default('')
		.refine(
			(val) => {
				if (!val) return true
				try {
					const parsed = JSON.parse(val)
					return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
				} catch {
					return false
				}
			},
			{ message: 'query must be a valid MongoDB JSON object (e.g. {"data.email": "test@example.com"})' },
		),
	contactCount: z.number().int().min(0).default(0),
})

export type TypeCrmGroup = z.infer<typeof schemaCrmGroup>

export class CrmGroupModel {
	private uuid: string
	private groupData: TypeCrmGroup

	constructor(props: TypeCrmGroup) {
		const parsedData = schemaCrmGroup.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.groupData = {
			...parsedData,
			uuid: this.uuid,
			slug: slugify(parsedData.name),
		}
	}

	getData(): TypeCrmGroup {
		return this.groupData
	}

	getUUID(): string {
		return this.uuid
	}
}
