import "server-only";

import { defaultTranslations, type TranslationMap } from "@/models/translations";
import { MongoDBStorage } from "@/services/MongoDBStorage";

type TranslationDoc = { locale: string; key: string; value: string };

export class TranslationStorage {
	static readonly COLLECTION = "translations";
	private static indexesReady = false;
	private static cache = new Map<string, TranslationMap>();

	static async ensureIndexes() {
		if (TranslationStorage.indexesReady) return;
		const collection = await MongoDBStorage.getCollection<TranslationDoc>(
			TranslationStorage.COLLECTION,
		);
		await Promise.all([
			collection.createIndex({ "data.locale": 1, "data.key": 1 }, { unique: true }),
		]);
		TranslationStorage.indexesReady = true;
	}

	static async getDictionary(locale: string): Promise<TranslationMap> {
		if (locale === "en") return { ...defaultTranslations };

		const cached = TranslationStorage.cache.get(locale);
		if (cached) return { ...defaultTranslations, ...cached };

		await TranslationStorage.ensureIndexes();
		const collection = await MongoDBStorage.getCollection<TranslationDoc>(
			TranslationStorage.COLLECTION,
		);
		const docs = await collection.find({ "data.locale": locale }).toArray();

		const translations: TranslationMap = {};
		for (const doc of docs) {
			if (doc.data?.key && doc.data?.value) {
				translations[doc.data.key] = doc.data.value;
			}
		}

		TranslationStorage.cache.set(locale, translations);
		return { ...defaultTranslations, ...translations };
	}

	static async getAll(locale: string): Promise<TranslationMap> {
		const dict = await TranslationStorage.getDictionary(locale);
		return dict;
	}

	static async setTranslations(locale: string, entries: TranslationMap) {
		await TranslationStorage.ensureIndexes();
		const collection = await MongoDBStorage.getCollection<TranslationDoc>(
			TranslationStorage.COLLECTION,
		);

		for (const [key, value] of Object.entries(entries)) {
			await collection.updateOne(
				{ "data.locale": locale, "data.key": key },
				{
					$set: { "data.locale": locale, "data.key": key, "data.value": value },
					$setOnInsert: { uuid: crypto.randomUUID(), _added: new Date(), _v: 1, _n: 0 },
				},
				{ upsert: true },
			);
		}

		TranslationStorage.cache.delete(locale);
	}

	static async getLocales(): Promise<string[]> {
		await TranslationStorage.ensureIndexes();
		const collection = await MongoDBStorage.getCollection<TranslationDoc>(
			TranslationStorage.COLLECTION,
		);
		const docs = await collection.distinct("data.locale");
		return ["en", ...docs.filter((l) => l !== "en")];
	}
}
