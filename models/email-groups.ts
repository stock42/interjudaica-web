import { z } from 'zod'
import { createUuid, slugify } from '@/models/model-utils'

export const schemaEmailGroup = z.object({
	uuid: z.string().uuid().optional(),
	name: z.string().trim().min(2).max(300),
	slug: z.string().trim().optional(),
	promoting: z.string().trim().min(1),
	query: z.string().trim().default(''),
})

export type TypeEmailGroup = z.infer<typeof schemaEmailGroup>

export class EmailGroupModel {
	private uuid: string
	private groupData: TypeEmailGroup

	constructor(props: TypeEmailGroup) {
		const parsedData = schemaEmailGroup.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.groupData = {
			...parsedData,
			uuid: this.uuid,
			slug: slugify(parsedData.name),
		}
	}

	getData(): TypeEmailGroup {
		return this.groupData
	}

	getUUID(): string {
		return this.uuid
	}
}
