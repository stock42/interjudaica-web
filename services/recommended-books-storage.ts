import 'server-only'

import {
	RecommendedBookModel,
	type TypeRecommendedBook,
} from '@/models/recommended-books'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class RecommendedBookStorage extends MongoDBStorage<TypeRecommendedBook> {
	static readonly COLLECTION = 'recommended_books'
	private static indexesReady = false

	constructor() {
		super(RecommendedBookStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (RecommendedBookStorage.indexesReady) {
			return
		}

		const collection = await MongoDBStorage.getCollection<TypeRecommendedBook>(
			RecommendedBookStorage.COLLECTION,
		)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.status': 1 }),
			collection.createIndex({ 'data.order': 1 }),
		])

		RecommendedBookStorage.indexesReady = true
	}

	static async list() {
		await RecommendedBookStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeRecommendedBook>(
			RecommendedBookStorage.COLLECTION,
			{},
			undefined,
			{ 'data.order': 1 },
		)

		return docs.map((doc) => doc.data)
	}

	static async listPublished() {
		await RecommendedBookStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeRecommendedBook>(
			RecommendedBookStorage.COLLECTION,
			{ 'data.status': 'published' },
			undefined,
			{ 'data.order': 1 },
		)

		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await RecommendedBookStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeRecommendedBook>(
			RecommendedBookStorage.COLLECTION,
			uuid,
		)

		return doc?.data ?? null
	}

	static async create(input: Partial<TypeRecommendedBook>) {
		await RecommendedBookStorage.ensureIndexes()
		const book = new RecommendedBookModel(input as TypeRecommendedBook)
		await MongoDBStorage._insert<TypeRecommendedBook>(
			RecommendedBookStorage.COLLECTION,
			book,
		)
		return book.getData()
	}

	static async update(uuid: string, input: Partial<TypeRecommendedBook>) {
		await RecommendedBookStorage.ensureIndexes()
		const existing = await MongoDBStorage._getByUUID<TypeRecommendedBook>(
			RecommendedBookStorage.COLLECTION,
			uuid,
		)

		if (!existing) {
			return null
		}

		const book = new RecommendedBookModel({
			...existing.data,
			...input,
			uuid,
		} as TypeRecommendedBook)

		await MongoDBStorage._replaceData<TypeRecommendedBook>(
			RecommendedBookStorage.COLLECTION,
			uuid,
			book.getData(),
		)

		return book.getData()
	}

	static async delete(uuid: string) {
		await RecommendedBookStorage.ensureIndexes()
		return MongoDBStorage._delete(RecommendedBookStorage.COLLECTION, uuid)
	}
}
