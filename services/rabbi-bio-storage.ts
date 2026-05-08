import "server-only";

import { RabbiBioModel, type TypeRabbiBio } from "@/models/rabbi-bio";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class RabbiBioStorage extends MongoDBStorage<TypeRabbiBio> {
	static readonly COLLECTION = "rabbi_bio";
	private static indexesReady = false;

	constructor() {
		super(RabbiBioStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (RabbiBioStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeRabbiBio>(
			RabbiBioStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.slug": 1 }, { unique: true }),
		]);

		RabbiBioStorage.indexesReady = true;
	}

	static async getBySlug(slug: string) {
		await RabbiBioStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypeRabbiBio>(
			RabbiBioStorage.COLLECTION,
			{ "data.slug": slug },
		);

		return doc?.data ?? null;
	}

	static async upsertBySlug(slug: string, input: Partial<TypeRabbiBio>) {
		await RabbiBioStorage.ensureIndexes();
		const existing = await RabbiBioStorage.getBySlug(slug);
		const bio = new RabbiBioModel({
			...existing,
			...input,
			slug,
			updatedAt: new Date().toISOString(),
		} as TypeRabbiBio);

		if (existing?.uuid) {
			await MongoDBStorage._replaceData<TypeRabbiBio>(
				RabbiBioStorage.COLLECTION,
				bio.getUUID(),
				bio.getData(),
			);
		} else {
			await MongoDBStorage._insert<TypeRabbiBio>(
				RabbiBioStorage.COLLECTION,
				bio,
			);
		}

		return bio.getData();
	}
}
