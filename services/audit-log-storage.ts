import "server-only";

import { randomUUID } from "crypto";
import { MongoDBStorage } from "@/services/MongoDBStorage";

type AuditLogData = {
	action: string;
	email?: string;
	ip: string;
	details: string;
	createdAt: string;
};

export class AuditLogStorage {
	static readonly COLLECTION = "audit_logs";
	private static indexesReady = false;

	static async ensureIndexes() {
		if (AuditLogStorage.indexesReady) return;
		const collection = await MongoDBStorage.getCollection<AuditLogData>(
			AuditLogStorage.COLLECTION,
		);
		await Promise.all([
			collection.createIndex({ "data.action": 1 }),
			collection.createIndex({ "data.email": 1 }),
			collection.createIndex({ "data.createdAt": -1 }),
		]);
		AuditLogStorage.indexesReady = true;
	}

	static async log(params: {
		action: string;
		email?: string;
		ip: string;
		details: string;
	}) {
		await AuditLogStorage.ensureIndexes();
		const collection = await MongoDBStorage.getCollection<AuditLogData>(
			AuditLogStorage.COLLECTION,
		);
		await collection.insertOne({
			uuid: randomUUID(),
			data: {
				...params,
				createdAt: new Date().toISOString(),
			},
			_added: new Date(),
			_v: 1,
			_n: 0,
		});
	}
}
