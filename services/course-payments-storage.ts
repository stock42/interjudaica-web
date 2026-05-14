import "server-only";

import { CoursePaymentModel, type TypeCoursePayment } from "@/models/course-payments";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class CoursePaymentStorage extends MongoDBStorage<TypeCoursePayment> {
	static readonly COLLECTION = "course_payments";
	private static indexesReady = false;

	constructor() {
		super(CoursePaymentStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (CoursePaymentStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeCoursePayment>(
			CoursePaymentStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.userUuid": 1, "data.courseUuid": 1 }),
			collection.createIndex({ "data.status": 1 }),
			collection.createIndex({ "data.stripeSessionId": 1 }),
		]);

		CoursePaymentStorage.indexesReady = true;
	}

  static async list() {
    await CoursePaymentStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeCoursePayment>(
      CoursePaymentStorage.COLLECTION,
      {},
      undefined,
      { "data.createdAt": -1 },
    );
    return docs.map((doc) => doc.data);
  }

  static async createPending(input: Partial<TypeCoursePayment>) {
		await CoursePaymentStorage.ensureIndexes();
		const payment = new CoursePaymentModel({
			amount: 0,
			currency: "usd",
			status: "pending",
			createdAt: new Date().toISOString(),
			...input,
		} as TypeCoursePayment);
		await MongoDBStorage._insert<TypeCoursePayment>(
			CoursePaymentStorage.COLLECTION,
			payment,
		);
		return payment.getData();
	}

	static async updateBySession(sessionId: string, update: Partial<TypeCoursePayment>) {
		await CoursePaymentStorage.ensureIndexes();
		return MongoDBStorage._update<TypeCoursePayment>(
			CoursePaymentStorage.COLLECTION,
			{ "data.stripeSessionId": sessionId },
			update,
			{ upsert: false },
		);
	}

	static async getBySession(sessionId: string) {
		await CoursePaymentStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypeCoursePayment>(
			CoursePaymentStorage.COLLECTION,
			{ "data.stripeSessionId": sessionId },
		);

		return doc?.data ?? null;
	}
}
