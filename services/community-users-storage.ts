import "server-only";

import { CommunityUserModel, type TypeCommunityUser } from "@/models/community-users";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class CommunityUserStorage extends MongoDBStorage<TypeCommunityUser> {
	static readonly COLLECTION = "community_users";
	private static indexesReady = false;

	constructor() {
		super(CommunityUserStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (CommunityUserStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeCommunityUser>(
			CommunityUserStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.userUuid": 1 }, { unique: true }),
			collection.createIndex({ "data.status": 1 }),
		]);

		CommunityUserStorage.indexesReady = true;
	}

	static async list() {
		await CommunityUserStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeCommunityUser>(
			CommunityUserStorage.COLLECTION,
			{},
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async getByUserUuid(userUuid: string) {
		await CommunityUserStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypeCommunityUser>(
			CommunityUserStorage.COLLECTION,
			{ "data.userUuid": userUuid },
		);

		return doc?.data ?? null;
	}

	static async upsertActive(input: Partial<TypeCommunityUser>) {
		await CommunityUserStorage.ensureIndexes();
		const existing = await MongoDBStorage._findOne<TypeCommunityUser>(
			CommunityUserStorage.COLLECTION,
			{ "data.userUuid": input.userUuid },
		);

		const user = new CommunityUserModel({
			status: "active",
			subscribedAt: new Date().toISOString(),
			...existing?.data,
			...input,
		} as TypeCommunityUser);

		if (existing?.uuid) {
			await MongoDBStorage._replaceData<TypeCommunityUser>(
				CommunityUserStorage.COLLECTION,
				existing.uuid,
				user.getData(),
			);
		} else {
			await MongoDBStorage._insert<TypeCommunityUser>(
				CommunityUserStorage.COLLECTION,
				user,
			);
		}

		return user.getData();
	}

	static async markCancelledBySubscription(subscriptionId: string) {
		await CommunityUserStorage.ensureIndexes();
		return MongoDBStorage._update<TypeCommunityUser>(
			CommunityUserStorage.COLLECTION,
			{ "data.stripeSubscriptionId": subscriptionId },
			{ status: "cancelled" },
			{ upsert: false },
		);
	}
}
