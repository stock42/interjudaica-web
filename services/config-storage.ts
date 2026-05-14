import "server-only";

import { randomUUID } from "crypto";
import { defaultConfig, getDefaultValue, type ConfigEntry } from "@/models/config";
import { MongoDBStorage, type TypeDocument } from "@/services/MongoDBStorage";

type ConfigDoc = { key: string; value: string };

const cache = new Map<string, string>();
let loaded = false;

export class ConfigStorage {
	static readonly COLLECTION = "config";

	static async ensureIndexes() {
		const collection = await MongoDBStorage.getCollection<ConfigDoc>(ConfigStorage.COLLECTION);
		await collection.createIndex({ "data.key": 1 }, { unique: true }).catch(() => {});
	}

	static async loadAll() {
		if (loaded) return;
		await ConfigStorage.ensureIndexes();

		const collection = await MongoDBStorage.getCollection<ConfigDoc>(ConfigStorage.COLLECTION);
		const docs = await collection.find({}).toArray();
		for (const doc of docs) {
			const data = doc.data as ConfigDoc | undefined;
			if (data?.key) {
				cache.set(data.key, data.value);
			}
		}
		loaded = true;
	}

	static async get(key: string): Promise<string> {
		await ConfigStorage.loadAll();
		return cache.get(key) ?? getDefaultValue(key);
	}

	static async getNumber(key: string): Promise<number> {
		return Number(await ConfigStorage.get(key));
	}

	static async getAll(): Promise<ConfigEntry[]> {
		await ConfigStorage.loadAll();
		return defaultConfig.map((def) => ({
			...def,
			value: cache.get(def.key) ?? def.value,
		}));
	}

	static async set(key: string, value: string) {
		await ConfigStorage.ensureIndexes();
		const collection = await MongoDBStorage.getCollection<ConfigDoc>(ConfigStorage.COLLECTION);

		const existing = await collection.findOne({ "data.key": key });
		if (existing) {
			await collection.updateOne(
				{ "data.key": key },
				{ $set: { "data.value": value, _updated: new Date(), _v: existing._v + 1 } },
			);
		} else {
			const doc: TypeDocument<ConfigDoc> = {
				uuid: randomUUID(),
				data: { key, value },
				_added: new Date(),
				_updated: new Date(),
				_v: 1,
				_n: 0,
			};
			await collection.insertOne(doc);
		}

		cache.set(key, value);

		try {
			const { resetConfigCache } = await import("@/lib/config");
			resetConfigCache();
		} catch {}
	}

	static resetCache() {
		cache.clear();
		loaded = false;
	}
}
