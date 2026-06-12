import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

// ── Conversation ────────────────────────────────────────────────

export const schemaBookAiConversation = z.object({
	uuid: z.string().uuid(),
	bookUuid: z.string().uuid(),
	operatorUuid: z.string().uuid(),
	threadUuid: z.string().uuid(),
	title: z.string().max(200).default('New conversation'),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
})

export type TypeBookAiConversation = z.infer<typeof schemaBookAiConversation>

export class BookAiConversationModel {
	private uuid: string
	private data: TypeBookAiConversation

	constructor(props: Partial<TypeBookAiConversation> = {}) {
		const now = new Date().toISOString()
		this.uuid = props.uuid || createUuid()
		this.data = schemaBookAiConversation.parse({
			uuid: this.uuid,
			bookUuid:
				props.bookUuid ||
				'00000000-0000-0000-0000-000000000000',
			operatorUuid:
				props.operatorUuid ||
				'00000000-0000-0000-0000-000000000000',
			threadUuid:
				props.threadUuid ||
				'00000000-0000-0000-0000-000000000000',
			title: props.title || 'New conversation',
			createdAt: props.createdAt || now,
			updatedAt: props.updatedAt || now,
		})
	}

	getData(): TypeBookAiConversation {
		return this.data
	}

	getUUID(): string {
		return this.uuid
	}
}
