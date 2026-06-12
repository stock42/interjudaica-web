import 'server-only'

import {
	CrmGroupModel,
	type TypeCrmGroup,
} from '@/models/crm-groups'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class CrmGroupStorage extends MongoDBStorage<TypeCrmGroup> {
	static readonly COLLECTION = 'crm_groups'
	private static indexesReady = false

	constructor() {
		super(CrmGroupStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (CrmGroupStorage.indexesReady) return
		const collection =
			await MongoDBStorage.getCollection<TypeCrmGroup>(
				CrmGroupStorage.COLLECTION,
			)
		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.slug': 1 }, { unique: true }),
			collection.createIndex({ 'data.name': 'text' }),
		])
		CrmGroupStorage.indexesReady = true
	}

	static async list() {
		await CrmGroupStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeCrmGroup>(
			CrmGroupStorage.COLLECTION,
			{},
			undefined,
			{ 'data.name': 1 },
		)
		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await CrmGroupStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeCrmGroup>(
			CrmGroupStorage.COLLECTION,
			uuid,
		)
		return doc?.data ?? null
	}

	static async create(input: Partial<TypeCrmGroup>) {
		await CrmGroupStorage.ensureIndexes()
		const group = new CrmGroupModel(input as TypeCrmGroup)
		await MongoDBStorage._insert<TypeCrmGroup>(
			CrmGroupStorage.COLLECTION,
			group,
		)
		return group.getData()
	}

	static async update(uuid: string, input: Partial<TypeCrmGroup>) {
		await CrmGroupStorage.ensureIndexes()
		const existing = await MongoDBStorage._getByUUID<TypeCrmGroup>(
			CrmGroupStorage.COLLECTION,
			uuid,
		)
		if (!existing) return null
		const group = new CrmGroupModel({
			...existing.data,
			...input,
			uuid,
		})
		await MongoDBStorage._replaceData<TypeCrmGroup>(
			CrmGroupStorage.COLLECTION,
			uuid,
			group.getData(),
		)
		return group.getData()
	}

	static async delete(uuid: string) {
		await CrmGroupStorage.ensureIndexes()
		return MongoDBStorage._delete(CrmGroupStorage.COLLECTION, uuid)
	}
}
