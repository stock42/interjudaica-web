import 'server-only'

import {
	EmailGroupModel,
	type TypeEmailGroup,
} from '@/models/email-groups'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class EmailGroupStorage extends MongoDBStorage<TypeEmailGroup> {
	static readonly COLLECTION = 'email_groups'
	private static indexesReady = false

	constructor() {
		super(EmailGroupStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (EmailGroupStorage.indexesReady) return
		const collection =
			await MongoDBStorage.getCollection<TypeEmailGroup>(
				EmailGroupStorage.COLLECTION,
			)
		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.slug': 1 }, { unique: true }),
			collection.createIndex({ 'data.name': 'text' }),
		])
		EmailGroupStorage.indexesReady = true
	}

	static async list() {
		await EmailGroupStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeEmailGroup>(
			EmailGroupStorage.COLLECTION,
			{},
			undefined,
			{ 'data.name': 1 },
		)
		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await EmailGroupStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeEmailGroup>(
			EmailGroupStorage.COLLECTION,
			uuid,
		)
		return doc?.data ?? null
	}

	static async create(input: Partial<TypeEmailGroup>) {
		await EmailGroupStorage.ensureIndexes()
		const group = new EmailGroupModel(input as TypeEmailGroup)
		await MongoDBStorage._insert<TypeEmailGroup>(
			EmailGroupStorage.COLLECTION,
			group,
		)
		return group.getData()
	}

	static async update(uuid: string, input: Partial<TypeEmailGroup>) {
		await EmailGroupStorage.ensureIndexes()
		const existing = await MongoDBStorage._getByUUID<TypeEmailGroup>(
			EmailGroupStorage.COLLECTION,
			uuid,
		)
		if (!existing) return null
		const group = new EmailGroupModel({
			...existing.data,
			...input,
			uuid,
		})
		await MongoDBStorage._replaceData<TypeEmailGroup>(
			EmailGroupStorage.COLLECTION,
			uuid,
			group.getData(),
		)
		return group.getData()
	}

	static async delete(uuid: string) {
		await EmailGroupStorage.ensureIndexes()
		return MongoDBStorage._delete(EmailGroupStorage.COLLECTION, uuid)
	}
}
