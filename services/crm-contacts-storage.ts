import 'server-only'

import {
	CrmContactModel,
	type TypeCrmContact,
	type TypeCrmContactImport,
} from '@/models/crm-contacts'
import { CrmTagStorage } from '@/services/crm-tags-storage'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class CrmContactStorage extends MongoDBStorage<TypeCrmContact> {
	static readonly COLLECTION = 'crm_contacts'
	private static indexesReady = false

	constructor() {
		super(CrmContactStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (CrmContactStorage.indexesReady) {
			return
		}

		const collection = await MongoDBStorage.getCollection<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
		)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.email': 1 }),
			collection.createIndex({ 'data.tags': 1 }),
		])

		try {
			await collection.createIndex({
				'data.firstname': 'text',
				'data.lastname': 'text',
				'data.email': 'text',
			})
		} catch {
			// text index may already exist from a previous partial creation
		}

		CrmContactStorage.indexesReady = true
	}

	static async search(options: {
		page?: number
		limit?: number
		query?: string
		tagUuids?: string[]
		sort?: string
	}) {
		await CrmContactStorage.ensureIndexes()

		const page = Math.max(options.page ?? 1, 1)
		const limit = Math.max(options.limit ?? 30, 1)
		const query = options.query?.trim()
		const tagUuids = options.tagUuids?.filter(Boolean) ?? []

		const filter: Record<string, unknown> = {}

		if (query) {
			filter.$text = { $search: query }
		}

		if (tagUuids.length > 0) {
			filter['data.tags'] = { $all: tagUuids }
		}

		const result = await MongoDBStorage._search<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
			filter,
			undefined,
			{
				page,
				limit,
				sort: { _added: -1 },
			},
		)

		return {
			items: result.docs.map((doc) => doc.data),
			page: result.page,
			totalPages: result.totalPages,
			count: result.count,
		}
	}

	static async get(uuid: string) {
		await CrmContactStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
			uuid,
		)
		return doc?.data ?? null
	}

	static async getByEmail(email: string) {
		await CrmContactStorage.ensureIndexes()
		const normalized = email.trim().toLowerCase()
		const doc = await MongoDBStorage._findOne<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
			{ 'data.email': normalized },
		)
		return doc?.data ?? null
	}

	static async getMatchingContacts(
		queryObj: Record<string, unknown>,
	): Promise<TypeCrmContact[]> {
		await CrmContactStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
			queryObj,
		)
		return docs.map((doc) => doc.data)
	}

	static async create(input: Partial<TypeCrmContact>) {
		await CrmContactStorage.ensureIndexes()
		const contact = new CrmContactModel(input as TypeCrmContact)
		await MongoDBStorage._insert<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
			contact,
		)
		return contact.getData()
	}

	static async update(uuid: string, input: Partial<TypeCrmContact>) {
		await CrmContactStorage.ensureIndexes()
		const existing = await MongoDBStorage._getByUUID<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
			uuid,
		)

		if (!existing) {
			return null
		}

		const merged = {
			...existing.data,
			...input,
			uuid,
		}

		if (
			input.notes !== undefined &&
			input.notes !== existing.data.notes
		) {
			merged.notesUpdatedAt = new Date().toISOString()
		}

		const contact = new CrmContactModel(merged)

		await MongoDBStorage._replaceData<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
			uuid,
			contact.getData(),
		)

		return contact.getData()
	}

	static async delete(uuid: string) {
		await CrmContactStorage.ensureIndexes()
		return MongoDBStorage._delete(CrmContactStorage.COLLECTION, uuid)
	}

	static async bulkImport(
		contacts: TypeCrmContactImport[],
	): Promise<{ imported: number; skipped: number }> {
		await CrmContactStorage.ensureIndexes()

		let imported = 0
		let skipped = 0

		for (const row of contacts) {
			const email = row.email.trim().toLowerCase()

			if (!email || !row.firstname.trim() || !row.lastname.trim()) {
				skipped++
				continue
			}

			const existing = await CrmContactStorage.getByEmail(email)
			if (existing) {
				skipped++
				continue
			}

			await CrmContactStorage.create({
				firstname: row.firstname.trim(),
				lastname: row.lastname.trim(),
				email,
			})
			imported++
		}

		return { imported, skipped }
	}

	static async getExportData(options?: {
		query?: string
		tagUuids?: string[]
	}): Promise<
		{ firstname: string; lastname: string; email: string; tags: string }[]
	> {
		await CrmContactStorage.ensureIndexes()

		const filter: Record<string, unknown> = {}
		const query = options?.query?.trim()
		const tagUuids = options?.tagUuids?.filter(Boolean) ?? []

		if (query) {
			filter.$text = { $search: query }
		}

		if (tagUuids.length > 0) {
			filter['data.tags'] = { $all: tagUuids }
		}

		const docs = await MongoDBStorage._find<TypeCrmContact>(
			CrmContactStorage.COLLECTION,
			filter,
		)

		const allTags = await CrmTagStorage.list()
		const tagMap = new Map(allTags.map((t) => [t.uuid, t.name]))

		return docs.map((doc) => {
			const d = doc.data
			const tagNames = (d.tags ?? [])
				.map((uuid) => tagMap.get(uuid) ?? '')
				.filter(Boolean)
				.join(';')

			return {
				firstname: d.firstname,
				lastname: d.lastname,
				email: d.email,
				tags: tagNames,
			}
		})
	}
}
