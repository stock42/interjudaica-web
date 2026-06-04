import 'server-only'

import {
	SubscriptionPlanModel,
	type TypeSubscriptionPlan,
} from '@/models/subscription-plans'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class SubscriptionPlanStorage extends MongoDBStorage<TypeSubscriptionPlan> {
	static readonly COLLECTION = 'subscription_plans'
	private static indexesReady = false

	constructor() {
		super(SubscriptionPlanStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (SubscriptionPlanStorage.indexesReady) {
			return
		}

		const collection =
			await MongoDBStorage.getCollection<TypeSubscriptionPlan>(
				SubscriptionPlanStorage.COLLECTION,
			)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.active': 1 }),
		])

		SubscriptionPlanStorage.indexesReady = true
	}

	static async list(includeArchived = false) {
		await SubscriptionPlanStorage.ensureIndexes()
		const filter: Record<string, unknown> = {}
		if (!includeArchived) {
			filter['data.active'] = true
		}
		const docs = await MongoDBStorage._find<TypeSubscriptionPlan>(
			SubscriptionPlanStorage.COLLECTION,
			filter,
			undefined,
			{ _added: -1 },
		)

		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await SubscriptionPlanStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeSubscriptionPlan>(
			SubscriptionPlanStorage.COLLECTION,
			uuid,
		)

		return doc?.data ?? null
	}

	static async create(input: Partial<TypeSubscriptionPlan>) {
		await SubscriptionPlanStorage.ensureIndexes()
		const plan = new SubscriptionPlanModel(input as TypeSubscriptionPlan)
		await MongoDBStorage._insert<TypeSubscriptionPlan>(
			SubscriptionPlanStorage.COLLECTION,
			plan,
		)
		return plan.getData()
	}

	static async update(uuid: string, input: Partial<TypeSubscriptionPlan>) {
		await SubscriptionPlanStorage.ensureIndexes()
		const existing = await MongoDBStorage._getByUUID<TypeSubscriptionPlan>(
			SubscriptionPlanStorage.COLLECTION,
			uuid,
		)

		if (!existing) {
			return null
		}

		const plan = new SubscriptionPlanModel({
			...existing.data,
			...input,
			uuid,
		} as TypeSubscriptionPlan)

		await MongoDBStorage._replaceData<TypeSubscriptionPlan>(
			SubscriptionPlanStorage.COLLECTION,
			uuid,
			plan.getData(),
		)

		return plan.getData()
	}

	static async remove(uuid: string) {
		await SubscriptionPlanStorage.ensureIndexes()
		return MongoDBStorage._delete(
			SubscriptionPlanStorage.COLLECTION,
			uuid,
		)
	}
}
