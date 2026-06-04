import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const schemaCrmContact = z.object({
	uuid: z.string().uuid().optional(),
	firstname: z.string().trim().min(1).max(200),
	lastname: z.string().trim().min(1).max(200),
	email: z
		.string()
		.email()
		.max(320)
		.transform((e) => e.toLowerCase().trim()),
	notes: z.string().trim().default(''),
	notesUpdatedAt: z.string().trim().default(''),
	tags: z.array(z.string().uuid()).default([]),
})

export const schemaCrmContactImport = z.object({
	firstname: z.string().trim().min(1).max(200),
	lastname: z.string().trim().min(1).max(200),
	email: z
		.string()
		.email()
		.max(320)
		.transform((e) => e.toLowerCase().trim()),
})

export type TypeCrmContact = z.infer<typeof schemaCrmContact>
export type TypeCrmContactImport = z.infer<typeof schemaCrmContactImport>

export class CrmContactModel {
	private uuid: string
	private contactData: TypeCrmContact

	constructor(props: TypeCrmContact) {
		const parsedData = schemaCrmContact.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.contactData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeCrmContact {
		return this.contactData
	}

	getUUID(): string {
		return this.uuid
	}
}
