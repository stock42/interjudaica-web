import "server-only";

import { randomUUID } from "crypto";
import { MongoDBStorage, type TypeDocument } from "@/services/MongoDBStorage";

export type ErrorEventRecord = {
	uuid: string;
	level: "error" | "warn";
	event: string;
	message: string;
	stack: string;
	statusCode: number;
	route: string;
	method: string;
	context: Record<string, unknown>;
	createdAt: string;
};

export class ErrorEventStorage extends MongoDBStorage<ErrorEventRecord> {
	static readonly COLLECTION = "error_events";
	private static indexesReady = false;

	constructor() {
		super(ErrorEventStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (ErrorEventStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<ErrorEventRecord>(
			ErrorEventStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.createdAt": -1 }),
			collection.createIndex({ "data.level": 1, "data.createdAt": -1 }),
			collection.createIndex({ "data.event": 1, "data.createdAt": -1 }),
		]);

		ErrorEventStorage.indexesReady = true;
	}

	static async record(
		input: Omit<ErrorEventRecord, "uuid" | "createdAt"> &
			Partial<Pick<ErrorEventRecord, "uuid" | "createdAt">>,
	) {
		await ErrorEventStorage.ensureIndexes();

		const event: ErrorEventRecord = {
			uuid: input.uuid ?? randomUUID(),
			createdAt: input.createdAt ?? new Date().toISOString(),
			level: input.level,
			event: input.event,
			message: input.message,
			stack: input.stack,
			statusCode: input.statusCode,
			route: input.route,
			method: input.method,
			context: input.context,
		};

		const doc: TypeDocument<ErrorEventRecord> = {
			uuid: event.uuid,
			data: event,
			_added: new Date(),
			_updated: new Date(),
			_v: 1,
			_n: 0,
		};

		const collection = await MongoDBStorage.getCollection<ErrorEventRecord>(
			ErrorEventStorage.COLLECTION,
		);
		await collection.insertOne(doc);
		return event;
	}

	static async listRecent(limit = 20) {
		await ErrorEventStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<ErrorEventRecord>(
			ErrorEventStorage.COLLECTION,
			{},
			undefined,
			{ "data.createdAt": -1 },
		);

		return docs.slice(0, limit).map((doc) => doc.data);
	}

	static async countSince(sinceIso: string) {
		await ErrorEventStorage.ensureIndexes();
		return MongoDBStorage._count<ErrorEventRecord>(
			ErrorEventStorage.COLLECTION,
			{ "data.createdAt": { $gte: sinceIso } },
		);
	}
}
