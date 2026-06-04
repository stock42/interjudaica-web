import 'server-only'

import {
	EmailSpoolerModel,
	type TypeEmailSpooler,
} from '@/models/email-spooler'
import { MongoDBStorage, type TypeDocument } from '@/services/MongoDBStorage'
import type { Filter } from 'mongodb'

export class EmailSpoolerStorage extends MongoDBStorage<TypeEmailSpooler> {
	static readonly COLLECTION = 'email_spooler'
	private static indexesReady = false

	constructor() {
		super(EmailSpoolerStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (EmailSpoolerStorage.indexesReady) return
		const collection =
			await MongoDBStorage.getCollection<TypeEmailSpooler>(
				EmailSpoolerStorage.COLLECTION,
			)
		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.campaignUuid': 1 }),
			collection.createIndex({ 'data.status': 1 }),
			collection.createIndex({
				'data.status': 1,
				'data.deliveryTime': 1,
			}),
		])
		EmailSpoolerStorage.indexesReady = true
	}

	static async listByCampaign(
		campaignUuid: string,
		options?: { page?: number; limit?: number; status?: string },
	) {
		await EmailSpoolerStorage.ensureIndexes()
		const filter: Record<string, unknown> = {
			'data.campaignUuid': campaignUuid,
		}
		if (options?.status) {
			filter['data.status'] = options.status
		}
		const result = await MongoDBStorage._search<TypeEmailSpooler>(
			EmailSpoolerStorage.COLLECTION,
			filter as Filter<TypeDocument<TypeEmailSpooler>>,
			undefined,
			{
				page: options?.page ?? 1,
				limit: options?.limit ?? 30,
				sort: { _added: -1 },
			},
		)
		return {
			items: result.docs.map((doc) => doc.data),
			page: result.page,
			totalPages: result.totalPages,
			count: result.count,
		}
	}

	static async get(uuid: string) {
		await EmailSpoolerStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeEmailSpooler>(
			EmailSpoolerStorage.COLLECTION,
			uuid,
		)
		return doc?.data ?? null
	}

	static async create(input: Partial<TypeEmailSpooler>) {
		await EmailSpoolerStorage.ensureIndexes()
		const spooler = new EmailSpoolerModel(input as TypeEmailSpooler)
		await MongoDBStorage._insert<TypeEmailSpooler>(
			EmailSpoolerStorage.COLLECTION,
			spooler,
		)
		return spooler.getData()
	}

	static async createBatch(items: Partial<TypeEmailSpooler>[]) {
		await EmailSpoolerStorage.ensureIndexes()
		const collection =
			await MongoDBStorage.getCollection<TypeEmailSpooler>(
				EmailSpoolerStorage.COLLECTION,
			)
		const docs = items.map((item) => {
			const model = new EmailSpoolerModel(item as TypeEmailSpooler)
			return {
				uuid: model.getUUID(),
				data: model.getData(),
				_added: new Date(),
				_updated: new Date(),
				_v: 1,
				_n: 0,
			}
		})
		await collection.insertMany(docs)
		return docs.map((d) => d.data)
	}

	/** Get pending emails ready for delivery (status=new, deliveryTime <= now or null) */
	static async listPending(limit = 50) {
		await EmailSpoolerStorage.ensureIndexes()
		const now = new Date().toISOString()
		const docs = await MongoDBStorage._find<TypeEmailSpooler>(
			EmailSpoolerStorage.COLLECTION,
			{
				$and: [
					{ 'data.status': 'new' },
					{
						$or: [
							{ 'data.deliveryTime': null },
							{ 'data.deliveryTime': { $lte: now } },
						],
					},
				],
			} as Filter<TypeDocument<TypeEmailSpooler>>,
			undefined,
			{ _added: 1 },
		)
		return docs.slice(0, limit).map((doc) => doc.data)
	}

	static async markAsSent(uuid: string) {
		await EmailSpoolerStorage.ensureIndexes()
		const collection =
			await MongoDBStorage.getCollection<TypeEmailSpooler>(
				EmailSpoolerStorage.COLLECTION,
			)
		await collection.updateOne(
			{ uuid },
			{
				$set: { 'data.status': 'sent', _updated: new Date() },
				$inc: { _n: 1 },
			},
		)
	}

	static async markAsError(uuid: string, errorMessage: string) {
		await EmailSpoolerStorage.ensureIndexes()
		const collection =
			await MongoDBStorage.getCollection<TypeEmailSpooler>(
				EmailSpoolerStorage.COLLECTION,
			)
		await collection.updateOne(
			{ uuid },
			{
				$set: {
					'data.status': 'error',
					'data.error': errorMessage,
					_updated: new Date(),
				},
				$inc: { _n: 1 },
			},
		)
	}

	static async retryErrors(campaignUuid: string): Promise<number> {
		await EmailSpoolerStorage.ensureIndexes()
		const collection =
			await MongoDBStorage.getCollection<TypeEmailSpooler>(
				EmailSpoolerStorage.COLLECTION,
			)
		const result = await collection.updateMany(
			{
				'data.campaignUuid': campaignUuid,
				'data.status': 'error',
			} as Filter<TypeDocument<TypeEmailSpooler>>,
			{
				$set: {
					'data.status': 'new',
					'data.error': null,
					_updated: new Date(),
				},
				$inc: { _n: 1 },
			},
		)
		return result.modifiedCount
	}

	static async retrySingle(uuid: string): Promise<boolean> {
		await EmailSpoolerStorage.ensureIndexes()
		const collection =
			await MongoDBStorage.getCollection<TypeEmailSpooler>(
				EmailSpoolerStorage.COLLECTION,
			)
		const result = await collection.updateOne(
			{ uuid, 'data.status': 'error' },
			{
				$set: {
					'data.status': 'new',
					'data.error': null,
					_updated: new Date(),
				},
				$inc: { _n: 1 },
			},
		)
		return result.modifiedCount > 0
	}

	static async getStats(campaignUuid: string) {
		await EmailSpoolerStorage.ensureIndexes()
		const pipeline = [
			{ $match: { 'data.campaignUuid': campaignUuid } },
			{
				$group: {
					_id: '$data.status',
					count: { $sum: 1 },
				},
			},
		]
		const rows = await MongoDBStorage._aggregate(
			EmailSpoolerStorage.COLLECTION,
			pipeline,
		)
		const stats: Record<string, number> = {}
		for (const row of rows) {
			stats[row._id as string] = row.count as number
		}
		return {
			total: Object.values(stats).reduce((a, b) => a + b, 0),
			sent: stats.sent ?? 0,
			error: stats.error ?? 0,
			new: stats.new ?? 0,
		}
	}

	static async deleteByCampaign(campaignUuid: string) {
		await EmailSpoolerStorage.ensureIndexes()
		return MongoDBStorage._deleteMany<TypeEmailSpooler>(
			EmailSpoolerStorage.COLLECTION,
			{ 'data.campaignUuid': campaignUuid } as Filter<
				TypeDocument<TypeEmailSpooler>
			>,
		)
	}
}
