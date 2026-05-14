import "server-only";

import { randomUUID } from "crypto";
import { MongoDBStorage } from "@/services/MongoDBStorage";

type WebhookEventData = { eventId: string; processedAt: string };

export class WebhookEventStorage {
	static readonly COLLECTION = "webhook_events";
	private static indexesReady = false;

	static async ensureIndexes() {
		if (WebhookEventStorage.indexesReady) return;
		const collection = await MongoDBStorage.getCollection<WebhookEventData>(
			WebhookEventStorage.COLLECTION,
		);
		await collection.createIndex({ "data.eventId": 1 }, { unique: true }).catch(() => {});
		WebhookEventStorage.indexesReady = true;
	}

	static async isProcessed(eventId: string): Promise<boolean> {
		await WebhookEventStorage.ensureIndexes();
		const collection = await MongoDBStorage.getCollection<WebhookEventData>(
			WebhookEventStorage.COLLECTION,
		);
		const existing = await collection.findOne({ "data.eventId": eventId });
		return Boolean(existing);
	}

	static async markProcessed(eventId: string) {
		await WebhookEventStorage.ensureIndexes();
		const collection = await MongoDBStorage.getCollection<WebhookEventData>(
			WebhookEventStorage.COLLECTION,
		);
		await collection.insertOne({
			uuid: randomUUID(),
			data: { eventId, processedAt: new Date().toISOString() },
			_added: new Date(),
			_v: 1,
			_n: 0,
		}).catch(() => {});
	}
}
