import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const contactStatuses = ['new', 'replied'] as const

export const schemaContact = z.object({
	uuid: z.string().uuid().optional(),
	email: z.string().email().toLowerCase(),
	firstName: z.string().trim().min(1),
	lastName: z.string().trim().min(1),
	message: z.string().trim().min(1).max(5000),
	status: z.enum(contactStatuses).default('new'),
	createdAt: z.string().trim().default(''),
	repliedAt: z.string().trim().default(''),
	replySubject: z.string().trim().default(''),
	replyMessage: z.string().trim().default(''),
	ownerOperatorUuid: z.string().trim().default(''),
	dueAt: z.string().trim().default(''),
})

export type TypeContact = z.infer<typeof schemaContact>

export class ContactModel {
	private uuid: string
	private contactData: TypeContact

	constructor(props: TypeContact) {
		const parsedData = schemaContact.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.contactData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeContact {
		return this.contactData
	}

	getUUID(): string {
		return this.uuid
	}
}
