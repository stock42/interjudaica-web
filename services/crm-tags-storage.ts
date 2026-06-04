import 'server-only'

import { CrmTagModel, type TypeCrmTag } from '@/models/crm-tags'
import { MongoDBStorage, type TypeDocument } from '@/services/MongoDBStorage'
import type { Filter } from 'mongodb'

export class CrmTagStorage extends MongoDBStorage<TypeCrmTag> {
	static readonly COLLECTION = 'crm_tags'
	private static indexesReady = false

	constructor() {
		super(CrmTagStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (CrmTagStorage.indexesReady) {
			return
		}

		const collection =
			await MongoDBStorage.getCollection<TypeCrmTag>(CrmTagStorage.COLLECTION)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.name': 1 }, { unique: true }),
		])

		CrmTagStorage.indexesReady = true
	}

	static async list() {
		await CrmTagStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeCrmTag>(
			CrmTagStorage.COLLECTION,
			{},
			undefined,
			{ 'data.name': 1 },
		)

		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await CrmTagStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeCrmTag>(
			CrmTagStorage.COLLECTION,
			uuid,
		)

		return doc?.data ?? null
	}

	static async findByName(name: string) {
		await CrmTagStorage.ensureIndexes()
		const normalized = name.toLowerCase().trim()
		const doc = await MongoDBStorage._findOne<TypeCrmTag>(
			CrmTagStorage.COLLECTION,
			{ 'data.name': normalized } as Filter<TypeDocument<TypeCrmTag>>,
		)

		return doc?.data ?? null
	}

	static async createIfNotExists(name: string): Promise<TypeCrmTag> {
		await CrmTagStorage.ensureIndexes()
		const normalized = name.toLowerCase().trim()

		if (!normalized) {
			throw new Error('Tag name cannot be empty')
		}

		const existing = await CrmTagStorage.findByName(normalized)

		if (existing) {
			return existing
		}

		const tag = new CrmTagModel({ name: normalized })
		await MongoDBStorage._insert<TypeCrmTag>(CrmTagStorage.COLLECTION, tag)

		return tag.getData()
	}

	static async create(input: Partial<TypeCrmTag>) {
		await CrmTagStorage.ensureIndexes()
		const tag = new CrmTagModel(input as TypeCrmTag)
		await MongoDBStorage._insert<TypeCrmTag>(CrmTagStorage.COLLECTION, tag)

		return tag.getData()
	}

	static async delete(uuid: string) {
		await CrmTagStorage.ensureIndexes()
		return MongoDBStorage._delete(CrmTagStorage.COLLECTION, uuid)
	}
}
