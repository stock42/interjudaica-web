import "server-only";

import {
	PasswordResetAttemptModel,
	type TypePasswordResetAttempt,
} from "@/models/password-reset-attempts";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class PasswordResetAttemptStorage extends MongoDBStorage<TypePasswordResetAttempt> {
	static readonly COLLECTION = "password_reset_attempts";
	private static indexesReady = false;

	constructor() {
		super(PasswordResetAttemptStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (PasswordResetAttemptStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypePasswordResetAttempt>(
			PasswordResetAttemptStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.email": 1, _added: -1 }),
			collection.createIndex({ "data.status": 1, _added: -1 }),
		]);

		PasswordResetAttemptStorage.indexesReady = true;
	}

	static async list() {
		await PasswordResetAttemptStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypePasswordResetAttempt>(
			PasswordResetAttemptStorage.COLLECTION,
			{},
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async create(input: Partial<TypePasswordResetAttempt>) {
		await PasswordResetAttemptStorage.ensureIndexes();
		const attempt = new PasswordResetAttemptModel({
			createdAt: new Date().toISOString(),
			status: "failed",
			...input,
		} as TypePasswordResetAttempt);
		await MongoDBStorage._insert<TypePasswordResetAttempt>(
			PasswordResetAttemptStorage.COLLECTION,
			attempt,
		);
		return attempt.getData();
	}
}
