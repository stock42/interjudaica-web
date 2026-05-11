import "server-only";

import { CouponModel, type TypeCoupon } from "@/models/coupons";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class CouponStorage extends MongoDBStorage<TypeCoupon> {
	static readonly COLLECTION = "coupons";
	private static indexesReady = false;

	constructor() {
		super(CouponStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (CouponStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeCoupon>(
			CouponStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.code": 1 }, { unique: true }),
			collection.createIndex({ "data.scope": 1, "data.active": 1 }),
		]);

		CouponStorage.indexesReady = true;
	}

	static async list() {
		await CouponStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeCoupon>(
			CouponStorage.COLLECTION,
			{},
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async get(uuid: string) {
		await CouponStorage.ensureIndexes();
		const doc = await MongoDBStorage._getByUUID<TypeCoupon>(
			CouponStorage.COLLECTION,
			uuid,
		);

		return doc?.data ?? null;
	}

	static async create(input: Partial<TypeCoupon>) {
		await CouponStorage.ensureIndexes();
		const coupon = new CouponModel(input as TypeCoupon);
		await MongoDBStorage._insert<TypeCoupon>(CouponStorage.COLLECTION, coupon);
		return coupon.getData();
	}

	static async update(uuid: string, input: Partial<TypeCoupon>) {
		await CouponStorage.ensureIndexes();
		const existing = await MongoDBStorage._getByUUID<TypeCoupon>(
			CouponStorage.COLLECTION,
			uuid,
		);

		if (!existing) {
			return null;
		}

		const coupon = new CouponModel({
			...existing.data,
			...input,
			uuid,
		} as TypeCoupon);

		await MongoDBStorage._replaceData<TypeCoupon>(
			CouponStorage.COLLECTION,
			uuid,
			coupon.getData(),
		);

		return coupon.getData();
	}

	static async delete(uuid: string) {
		await CouponStorage.ensureIndexes();
		return MongoDBStorage._delete(CouponStorage.COLLECTION, uuid);
	}

	static async findValid({
		code,
		scope,
		courseUuid,
	}: {
		code: string;
		scope: "course" | "community";
		courseUuid?: string;
	}) {
		await CouponStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypeCoupon>(
			CouponStorage.COLLECTION,
			{ "data.code": code.toUpperCase(), "data.active": true },
		);

		if (!doc) {
			return null;
		}

		const coupon = doc.data;
		if (coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.now()) {
			return null;
		}

		if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
			return null;
		}

		if (coupon.scope === "course") {
			if (scope !== "course" || !courseUuid || coupon.courseUuid !== courseUuid) {
				return null;
			}
		}

		if (coupon.scope === "community" && scope !== "community") {
			return null;
		}

		return { coupon, uuid: doc.uuid };
	}

	static async incrementUsage(uuid: string) {
		await CouponStorage.ensureIndexes();
		const collection = await MongoDBStorage.getCollection<TypeCoupon>(
			CouponStorage.COLLECTION,
		);
		return collection.updateOne({ uuid }, { $inc: { "data.usageCount": 1 } });
	}
}
