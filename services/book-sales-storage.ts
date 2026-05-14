import "server-only";

import { BookSaleModel, type TypeBookSale } from "@/models/book-sales";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class BookSaleStorage extends MongoDBStorage<TypeBookSale> {
	static readonly COLLECTION = "book_sales";
	private static indexesReady = false;

	constructor() {
		super(BookSaleStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (BookSaleStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeBookSale>(
			BookSaleStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.bookUuid": 1 }),
			collection.createIndex({ "data.buyerEmail": 1 }),
			collection.createIndex({ "data.status": 1 }),
			collection.createIndex({ "data.stripeSessionId": 1 }),
			collection.createIndex({ "data.accessToken": 1 }),
		]);

		BookSaleStorage.indexesReady = true;
	}

	static async list() {
		await BookSaleStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeBookSale>(
			BookSaleStorage.COLLECTION,
			{},
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async create(input: Partial<TypeBookSale>) {
		await BookSaleStorage.ensureIndexes();
		const sale = new BookSaleModel({
			createdAt: new Date().toISOString(),
			status: "pending",
			currency: "usd",
			...input,
		} as TypeBookSale);
		await MongoDBStorage._insert<TypeBookSale>(
			BookSaleStorage.COLLECTION,
			sale,
		);
		return sale.getData();
	}

	static async getBySession(sessionId: string) {
		await BookSaleStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypeBookSale>(
			BookSaleStorage.COLLECTION,
			{ "data.stripeSessionId": sessionId },
		);

		return doc?.data ?? null;
	}

	static async listByEmail(email: string) {
		await BookSaleStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeBookSale>(
			BookSaleStorage.COLLECTION,
			{ "data.buyerEmail": email.toLowerCase() },
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async getByAccessToken(token: string) {
		await BookSaleStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypeBookSale>(
			BookSaleStorage.COLLECTION,
			{ "data.accessToken": token },
		);

		return doc?.data ?? null;
	}

	static async get(uuid: string) {
		await BookSaleStorage.ensureIndexes();
		const doc = await MongoDBStorage._getByUUID<TypeBookSale>(
			BookSaleStorage.COLLECTION,
			uuid,
		);

		return doc?.data ?? null;
	}

	static async markPaid(sessionId: string, paymentIntentId: string) {
		await BookSaleStorage.ensureIndexes();
		return MongoDBStorage._update<TypeBookSale>(
			BookSaleStorage.COLLECTION,
			{ "data.stripeSessionId": sessionId },
			{
				status: "paid",
				paidAt: new Date().toISOString(),
				stripePaymentIntentId: paymentIntentId,
			},
			{ upsert: false },
		);
	}

	static async markFailed(sessionId: string) {
		await BookSaleStorage.ensureIndexes();
		return MongoDBStorage._update<TypeBookSale>(
			BookSaleStorage.COLLECTION,
			{ "data.stripeSessionId": sessionId },
			{
				status: "failed",
			},
			{ upsert: false },
		);
	}
}
