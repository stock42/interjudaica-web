import 'server-only'

import { OwnerBioModel, type TypeOwnerBio } from '@/models/owner-bio'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class OwnerBioStorage extends MongoDBStorage<TypeOwnerBio> {
	static readonly COLLECTION = 'owner_bio'
	private static indexesReady = false

	constructor() {
		super(OwnerBioStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (OwnerBioStorage.indexesReady) {
			return
		}

		const collection = await MongoDBStorage.getCollection<TypeOwnerBio>(
			OwnerBioStorage.COLLECTION,
		)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.slug': 1 }, { unique: true }),
		])

		OwnerBioStorage.indexesReady = true
	}

	static async getBySlug(slug: string) {
		await OwnerBioStorage.ensureIndexes()
		const doc = await MongoDBStorage._findOne<TypeOwnerBio>(
			OwnerBioStorage.COLLECTION,
			{ 'data.slug': slug },
		)

		return doc?.data ?? null
	}

	static async upsertBySlug(slug: string, input: Partial<TypeOwnerBio>) {
		await OwnerBioStorage.ensureIndexes()
		const existing = await OwnerBioStorage.getBySlug(slug)
		const bio = new OwnerBioModel({
			...existing,
			...input,
			slug,
			updatedAt: new Date().toISOString(),
		} as TypeOwnerBio)

		if (existing?.uuid) {
			await MongoDBStorage._replaceData<TypeOwnerBio>(
				OwnerBioStorage.COLLECTION,
				bio.getUUID(),
				bio.getData(),
			)
		} else {
			await MongoDBStorage._insert<TypeOwnerBio>(
				OwnerBioStorage.COLLECTION,
				bio,
			)
		}

		return bio.getData()
	}
}
