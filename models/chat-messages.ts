import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const chatMessageRoles = ['user', 'assistant', 'tool'] as const

export const MAX_CONTENT_LENGTH = 10 * 1024 // 10KB

export const schemaChatMessage = z.object({
	uuid: z.string().uuid(),
	threadUuid: z.string().uuid(),
	role: z.enum(chatMessageRoles),
	content: z.string(),
	createdAt: z.string().datetime(),
})

export type TypeChatMessage = z.infer<typeof schemaChatMessage>

export class ChatMessageModel {
	private uuid: string
	private messageData: TypeChatMessage

	constructor(data: Partial<TypeChatMessage> = {}) {
		const now = new Date().toISOString()
		this.uuid = data.uuid || createUuid()
		this.messageData = schemaChatMessage.parse({
			uuid: this.uuid,
			threadUuid: data.threadUuid || '00000000-0000-0000-0000-000000000000',
			role: data.role || 'user',
			content: data.content || '',
			createdAt: data.createdAt || now,
		})
	}

	getData(): TypeChatMessage {
		return this.messageData
	}

	getUUID(): string {
		return this.uuid
	}

	/**
	 * Returns a storage-safe version of the message with content truncated
	 * to MAX_CONTENT_LENGTH if needed. The model itself keeps original content.
	 */
	getStorageData(): TypeChatMessage {
		const data = { ...this.messageData }
		if (data.content.length > MAX_CONTENT_LENGTH) {
			data.content =
				data.content.slice(0, MAX_CONTENT_LENGTH - 14) + '...[truncated]'
		}
		return data
	}
}
