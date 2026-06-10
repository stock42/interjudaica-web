import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const schemaChatThread = z.object({
	uuid: z.string().uuid(),
	userUuid: z.string().uuid(),
	title: z.string().max(100).default('New Chat'),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	messageCount: z.number().int().min(0).default(0),
})

export type TypeChatThread = z.infer<typeof schemaChatThread>

export class ChatThreadModel {
	private uuid: string
	private threadData: TypeChatThread

	constructor(data: Partial<TypeChatThread> = {}) {
		const now = new Date().toISOString()
		this.uuid = data.uuid || createUuid()
		this.threadData = schemaChatThread.parse({
			uuid: this.uuid,
			userUuid: data.userUuid || '00000000-0000-0000-0000-000000000000',
			title: data.title || 'New Chat',
			createdAt: data.createdAt || now,
			updatedAt: data.updatedAt || now,
			messageCount: data.messageCount || 0,
		})
	}

	getData(): TypeChatThread {
		return this.threadData
	}

	getUUID(): string {
		return this.uuid
	}
}
