import "server-only";

import { BookModel, type TypeBook } from "@/models/books";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class BookStorage extends MongoDBStorage<TypeBook> {
	static readonly COLLECTION = "books";
	private static indexesReady = false;

	constructor() {
		super(BookStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (BookStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeBook>(
			BookStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.slug": 1 }, { unique: true }),
			collection.createIndex({ "data.status": 1 }),
		]);

		BookStorage.indexesReady = true;
	}

	static async list() {
		await BookStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeBook>(
			BookStorage.COLLECTION,
			{},
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async listPublished() {
		await BookStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeBook>(
			BookStorage.COLLECTION,
			{ "data.status": "published" },
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async get(uuid: string) {
		await BookStorage.ensureIndexes();
		const doc = await MongoDBStorage._getByUUID<TypeBook>(
			BookStorage.COLLECTION,
			uuid,
		);

		return doc?.data ?? null;
	}

	static async findPublishedBySlug(slug: string) {
		await BookStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypeBook>(
			BookStorage.COLLECTION,
			{ "data.status": "published", "data.slug": slug },
		);

		return doc?.data ?? null;
	}

	static async create(input: Partial<TypeBook>) {
		await BookStorage.ensureIndexes();
		const book = new BookModel(input as TypeBook);
		await MongoDBStorage._insert<TypeBook>(BookStorage.COLLECTION, book);
		return book.getData();
	}

	static async update(uuid: string, input: Partial<TypeBook>) {
		await BookStorage.ensureIndexes();
		const existing = await MongoDBStorage._getByUUID<TypeBook>(
			BookStorage.COLLECTION,
			uuid,
		);

		if (!existing) {
			return null;
		}

		const book = new BookModel({
			...existing.data,
			...input,
			uuid,
		} as TypeBook);

		await MongoDBStorage._replaceData<TypeBook>(
			BookStorage.COLLECTION,
			uuid,
			book.getData(),
		);

		return book.getData();
	}

	static async delete(uuid: string) {
		await BookStorage.ensureIndexes();
		return MongoDBStorage._delete(BookStorage.COLLECTION, uuid);
	}
}
