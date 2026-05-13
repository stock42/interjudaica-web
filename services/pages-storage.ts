import "server-only";

import { PageModel, type TypePage } from "@/models/pages";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class PageStorage extends MongoDBStorage<TypePage> {
	static readonly COLLECTION = "pages";
	private static indexesReady = false;

	constructor() {
		super(PageStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (PageStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypePage>(
			PageStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.slug": 1 }, { unique: true }),
			collection.createIndex({ "data.status": 1 }),
		]);

		PageStorage.indexesReady = true;
	}

	static async list() {
		await PageStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypePage>(
			PageStorage.COLLECTION,
			{},
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async listPublished() {
		await PageStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypePage>(
			PageStorage.COLLECTION,
			{ "data.status": "published" },
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async get(uuid: string) {
		await PageStorage.ensureIndexes();
		const doc = await MongoDBStorage._getByUUID<TypePage>(
			PageStorage.COLLECTION,
			uuid,
		);

		return doc?.data ?? null;
	}

	static async findPublishedBySlug(slug: string) {
		await PageStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypePage>(
			PageStorage.COLLECTION,
			{ "data.status": "published", "data.slug": slug },
		);

		return doc?.data ?? null;
	}

	static async create(input: Partial<TypePage>) {
		await PageStorage.ensureIndexes();
		const page = new PageModel(input as TypePage);
		await MongoDBStorage._insert<TypePage>(PageStorage.COLLECTION, page);
		return page.getData();
	}

	static async update(uuid: string, input: Partial<TypePage>) {
		await PageStorage.ensureIndexes();
		const existing = await MongoDBStorage._getByUUID<TypePage>(
			PageStorage.COLLECTION,
			uuid,
		);

		if (!existing) {
			return null;
		}

		const page = new PageModel({
			...existing.data,
			...input,
			uuid,
		} as TypePage);

		await MongoDBStorage._replaceData<TypePage>(
			PageStorage.COLLECTION,
			uuid,
			page.getData(),
		);

		return page.getData();
	}

	static async delete(uuid: string) {
		await PageStorage.ensureIndexes();
		return MongoDBStorage._delete(PageStorage.COLLECTION, uuid);
	}
}
