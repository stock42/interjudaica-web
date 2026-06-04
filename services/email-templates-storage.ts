import 'server-only'

import {
	EmailTemplateModel,
	type TypeEmailTemplate,
} from '@/models/email-templates'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class EmailTemplateStorage extends MongoDBStorage<TypeEmailTemplate> {
	static readonly COLLECTION = 'email_templates'
	private static indexesReady = false

	constructor() {
		super(EmailTemplateStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (EmailTemplateStorage.indexesReady) return
		const collection =
			await MongoDBStorage.getCollection<TypeEmailTemplate>(
				EmailTemplateStorage.COLLECTION,
			)
		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.slug': 1 }, { unique: true }),
			collection.createIndex({ 'data.name': 'text' }),
		])
		EmailTemplateStorage.indexesReady = true
	}

	static async list() {
		await EmailTemplateStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeEmailTemplate>(
			EmailTemplateStorage.COLLECTION,
			{},
			undefined,
			{ 'data.name': 1 },
		)
		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await EmailTemplateStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeEmailTemplate>(
			EmailTemplateStorage.COLLECTION,
			uuid,
		)
		return doc?.data ?? null
	}

	static async create(input: Partial<TypeEmailTemplate>) {
		await EmailTemplateStorage.ensureIndexes()
		const template = new EmailTemplateModel(input as TypeEmailTemplate)
		await MongoDBStorage._insert<TypeEmailTemplate>(
			EmailTemplateStorage.COLLECTION,
			template,
		)
		return template.getData()
	}

	static async update(uuid: string, input: Partial<TypeEmailTemplate>) {
		await EmailTemplateStorage.ensureIndexes()
		const existing = await MongoDBStorage._getByUUID<TypeEmailTemplate>(
			EmailTemplateStorage.COLLECTION,
			uuid,
		)
		if (!existing) return null
		const template = new EmailTemplateModel({
			...existing.data,
			...input,
			uuid,
		})
		await MongoDBStorage._replaceData<TypeEmailTemplate>(
			EmailTemplateStorage.COLLECTION,
			uuid,
			template.getData(),
		)
		return template.getData()
	}

	static async delete(uuid: string) {
		await EmailTemplateStorage.ensureIndexes()
		return MongoDBStorage._delete(EmailTemplateStorage.COLLECTION, uuid)
	}
}
