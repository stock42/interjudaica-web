import 'server-only'

import {
	ChatThreadModel,
	type TypeChatThread,
} from '@/models/chat-threads'
import {
	ChatMessageModel,
	MAX_CONTENT_LENGTH,
	type TypeChatMessage,
} from '@/models/chat-messages'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class ChatStorage {
	static readonly THREADS_COLLECTION = 'chat_threads'
	static readonly MESSAGES_COLLECTION = 'chat_messages'
	private static indexesReady = false

	static async ensureIndexes() {
		if (ChatStorage.indexesReady) {
			return
		}

		const threadsCollection =
			await MongoDBStorage.getCollection<TypeChatThread>(
				ChatStorage.THREADS_COLLECTION,
			)
		const messagesCollection =
			await MongoDBStorage.getCollection<TypeChatMessage>(
				ChatStorage.MESSAGES_COLLECTION,
			)

		await Promise.all([
			// Threads indexes
			threadsCollection.createIndex({ uuid: 1 }, { unique: true }),
			threadsCollection.createIndex(
				{ 'data.userUuid': 1, 'data.updatedAt': -1 },
			),
			// Messages indexes
			messagesCollection.createIndex({ uuid: 1 }, { unique: true }),
			messagesCollection.createIndex(
				{ 'data.threadUuid': 1, 'data.createdAt': 1 },
			),
			// TTL index on messages: 90 days
			messagesCollection.createIndex(
				{ _added: 1 },
				{ expireAfterSeconds: 90 * 24 * 60 * 60 },
			),
		])

		ChatStorage.indexesReady = true
	}

	// ── Threads ──────────────────────────────────────────────

	static async createThread(userUuid: string): Promise<TypeChatThread> {
		await ChatStorage.ensureIndexes()
		const thread = new ChatThreadModel({ userUuid })
		await MongoDBStorage._insert<TypeChatThread>(
			ChatStorage.THREADS_COLLECTION,
			thread,
		)
		return thread.getData()
	}

	static async getThreads(userUuid: string): Promise<TypeChatThread[]> {
		await ChatStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeChatThread>(
			ChatStorage.THREADS_COLLECTION,
			{ 'data.userUuid': userUuid },
			undefined,
			{ 'data.updatedAt': -1 },
		)
		return docs.map((doc) => doc.data)
	}

	static async getThread(
		threadUuid: string,
	): Promise<TypeChatThread | null> {
		await ChatStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeChatThread>(
			ChatStorage.THREADS_COLLECTION,
			threadUuid,
		)
		return doc?.data ?? null
	}

	static async updateThread(
		threadUuid: string,
		updates: Partial<TypeChatThread>,
	): Promise<void> {
		await ChatStorage.ensureIndexes()
		await MongoDBStorage._replaceData<TypeChatThread>(
			ChatStorage.THREADS_COLLECTION,
			threadUuid,
			updates as TypeChatThread,
		)
	}

	// ── Messages ─────────────────────────────────────────────

	/**
	 * Truncate content to MAX_CONTENT_LENGTH before storage.
	 */
	private static truncateContent(content: string): string {
		if (content.length > MAX_CONTENT_LENGTH) {
			return (
				content.slice(0, MAX_CONTENT_LENGTH - 14) + '...[truncated]'
			)
		}
		return content
	}

	static async addMessage(
		message: TypeChatMessage,
	): Promise<TypeChatMessage> {
		await ChatStorage.ensureIndexes()

		// Truncate content if needed before storage
		const storageMessage = {
			...message,
			content: ChatStorage.truncateContent(message.content),
		}

		const model = new ChatMessageModel(storageMessage)
		await MongoDBStorage._insert<TypeChatMessage>(
			ChatStorage.MESSAGES_COLLECTION,
			model,
		)

		// Update thread metadata
		const thread = await ChatStorage.getThread(message.threadUuid)
		if (thread) {
			const messagesCount = await ChatStorage.getMessageCount(
				message.threadUuid,
			)
			await MongoDBStorage._replaceData<TypeChatThread>(
				ChatStorage.THREADS_COLLECTION,
				message.threadUuid,
				{
					...thread,
					updatedAt: new Date().toISOString(),
					messageCount: messagesCount,
				} as TypeChatThread,
			)
		}

		return model.getData()
	}

	static async getMessages(
		threadUuid: string,
		limit?: number,
	): Promise<TypeChatMessage[]> {
		await ChatStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeChatMessage>(
			ChatStorage.MESSAGES_COLLECTION,
			{ 'data.threadUuid': threadUuid },
			undefined,
			{ 'data.createdAt': 1 },
		)
		const result = docs.map((doc) => doc.data)
		return limit ? result.slice(-limit) : result
	}

	static async getRecentMessages(
		threadUuid: string,
		limit: number,
	): Promise<TypeChatMessage[]> {
		return ChatStorage.getMessages(threadUuid, limit)
	}

	static async getMessageCount(threadUuid: string): Promise<number> {
		return MongoDBStorage._count<TypeChatMessage>(
			ChatStorage.MESSAGES_COLLECTION,
			{ 'data.threadUuid': threadUuid },
		)
	}

	// ── Delete (cascade) ─────────────────────────────────────

	static async deleteThread(threadUuid: string): Promise<void> {
		await ChatStorage.ensureIndexes()
		await Promise.all([
			MongoDBStorage._deleteMany<TypeChatMessage>(
				ChatStorage.MESSAGES_COLLECTION,
				{ 'data.threadUuid': threadUuid },
			),
			MongoDBStorage._deleteOne<TypeChatThread>(
				ChatStorage.THREADS_COLLECTION,
				{ uuid: threadUuid },
			),
		])
	}
}
