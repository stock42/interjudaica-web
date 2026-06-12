import 'server-only'

import {
	BookAiConversationModel,
	type TypeBookAiConversation,
} from '@/models/book-ai-conversation'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class BookAiConversationStorage {
	static readonly COLLECTION = 'book_ai_conversations'
	private static indexesReady = false

	static async ensureIndexes() {
		if (BookAiConversationStorage.indexesReady) {
			return
		}

		const collection =
			await MongoDBStorage.getCollection<TypeBookAiConversation>(
				BookAiConversationStorage.COLLECTION,
			)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex(
				{ 'data.bookUuid': 1, 'data.updatedAt': -1 },
			),
			collection.createIndex(
				{ 'data.threadUuid': 1 },
				{ unique: true },
			),
		])

		BookAiConversationStorage.indexesReady = true
	}

	static async create(
		bookUuid: string,
		operatorUuid: string,
		threadUuid: string,
		title?: string,
	): Promise<TypeBookAiConversation> {
		await BookAiConversationStorage.ensureIndexes()
		const model = new BookAiConversationModel({
			bookUuid,
			operatorUuid,
			threadUuid,
			title: title || 'New conversation',
		})
		await MongoDBStorage._insert<TypeBookAiConversation>(
			BookAiConversationStorage.COLLECTION,
			model,
		)
		return model.getData()
	}

	static async listByBook(
		bookUuid: string,
	): Promise<TypeBookAiConversation[]> {
		await BookAiConversationStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeBookAiConversation>(
			BookAiConversationStorage.COLLECTION,
			{ 'data.bookUuid': bookUuid },
			undefined,
			{ 'data.updatedAt': -1 },
		)
		return docs.map((doc) => doc.data)
	}

	static async get(
		uuid: string,
	): Promise<TypeBookAiConversation | null> {
		await BookAiConversationStorage.ensureIndexes()
		const doc =
			await MongoDBStorage._getByUUID<TypeBookAiConversation>(
				BookAiConversationStorage.COLLECTION,
				uuid,
			)
		return doc?.data ?? null
	}

	static async getByThreadUuid(
		threadUuid: string,
	): Promise<TypeBookAiConversation | null> {
		await BookAiConversationStorage.ensureIndexes()
		const doc =
			await MongoDBStorage._findOne<TypeBookAiConversation>(
				BookAiConversationStorage.COLLECTION,
				{ 'data.threadUuid': threadUuid },
			)
		return doc?.data ?? null
	}

	static async update(
		uuid: string,
		updates: Partial<TypeBookAiConversation>,
	): Promise<TypeBookAiConversation | null> {
		await BookAiConversationStorage.ensureIndexes()
		const existing =
			await MongoDBStorage._getByUUID<TypeBookAiConversation>(
				BookAiConversationStorage.COLLECTION,
				uuid,
			)
		if (!existing) return null

		const merged: TypeBookAiConversation = {
			...existing.data,
			...updates,
			uuid,
			updatedAt: new Date().toISOString(),
		}
		await MongoDBStorage._replaceData<TypeBookAiConversation>(
			BookAiConversationStorage.COLLECTION,
			uuid,
			merged,
		)
		return merged
	}

	static async delete(uuid: string): Promise<boolean> {
		await BookAiConversationStorage.ensureIndexes()
		const deleted = await MongoDBStorage._delete(
				BookAiConversationStorage.COLLECTION,
				uuid,
			)
		return deleted > 0
	}
}
