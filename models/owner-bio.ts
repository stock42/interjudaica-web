import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const schemaOwnerBio = z.object({
	uuid: z.string().uuid().optional(),
	slug: z.string().trim().min(1).default('ernesto-yattah'),
	title: z.string().trim().default('Ernesto Yattah'),
	markdown: z.string().trim().default(''),
	updatedAt: z.string().trim().default(''),
})

export type TypeOwnerBio = z.infer<typeof schemaOwnerBio>

export class OwnerBioModel {
	private uuid: string
	private bioData: TypeOwnerBio

	constructor(props: TypeOwnerBio) {
		const parsedData = schemaOwnerBio.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.bioData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeOwnerBio {
		return this.bioData
	}

	getUUID(): string {
		return this.uuid
	}
}
