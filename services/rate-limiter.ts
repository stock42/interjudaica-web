import "server-only";

import { MongoDBStorage } from "@/services/MongoDBStorage";

type RateLimitDoc = {
	key: string;
	count: number;
	resetAt: Date;
};

let indexesReady = false;

async function ensureIndexes() {
	if (indexesReady) return;
	const collection = await MongoDBStorage.getCollection<RateLimitDoc>(
		"rate_limit_entries",
	);
	await Promise.all([
		collection.createIndex({ key: 1, resetAt: 1 }),
		collection.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }),
	]);
	indexesReady = true;
}

export function createRateLimiter(namespace: string) {
	const prefix = `${namespace}:`;

	return {
		async check(
			key: string,
			limit: number,
			windowMs: number,
		): Promise<{ allowed: boolean; retryAfter?: number }> {
			await ensureIndexes();
			const collection = await MongoDBStorage.getCollection<RateLimitDoc>(
				"rate_limit_entries",
			);

			const fullKey = `${prefix}${key}`;
			const now = new Date();

			const updated = await collection.findOneAndUpdate(
				{
					key: fullKey,
					resetAt: { $gt: now },
				},
				{ $inc: { count: 1 } },
				{ returnDocument: "after" },
			);

			if (updated) {
				const count = updated.count ?? 0;
				const resetAt = updated.data?.resetAt ?? updated.resetAt ?? new Date();
				if (count > limit) {
					const retryAfter = Math.ceil(
						(resetAt.getTime() - Date.now()) / 1000,
					);
					return { allowed: false, retryAfter };
				}
				return { allowed: true };
			}

			const resetAt = new Date(Date.now() + windowMs);
			await collection.updateOne(
				{ key: fullKey },
				{ $set: { key: fullKey, count: 1, resetAt } },
				{ upsert: true },
			);

			return { allowed: true };
		},

		async reset(key: string) {
			await ensureIndexes();
			const collection = await MongoDBStorage.getCollection<RateLimitDoc>(
				"rate_limit_entries",
			);
			await collection.deleteOne({ key: `${prefix}${key}` });
		},
	};
}
