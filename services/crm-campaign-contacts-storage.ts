import 'server-only'

import {
	CrmCampaignContactModel,
	type TypeCrmCampaignContact,
} from '@/models/crm-campaign-contacts'
import { MongoDBStorage, type TypeDocument } from '@/services/MongoDBStorage'
import type { Filter } from 'mongodb'

export class CrmCampaignContactStorage extends MongoDBStorage<TypeCrmCampaignContact> {
	static readonly COLLECTION = 'crm_campaign_contacts'
	private static indexesReady = false

	constructor() {
		super(CrmCampaignContactStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (CrmCampaignContactStorage.indexesReady) {
			return
		}

		const collection =
			await MongoDBStorage.getCollection<TypeCrmCampaignContact>(
				CrmCampaignContactStorage.COLLECTION,
			)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex(
				{ 'data.campaignUuid': 1, 'data.contactUuid': 1 },
				{ unique: true },
			),
			collection.createIndex({ 'data.campaignUuid': 1 }),
			collection.createIndex({ 'data.contactUuid': 1 }),
		])

		CrmCampaignContactStorage.indexesReady = true
	}

	static async listByCampaign(
		campaignUuid: string,
	): Promise<TypeCrmCampaignContact[]> {
		await CrmCampaignContactStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeCrmCampaignContact>(
			CrmCampaignContactStorage.COLLECTION,
			{ 'data.campaignUuid': campaignUuid } as Filter<TypeDocument<TypeCrmCampaignContact>>,
			undefined,
			{ _added: 1 },
		)

		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await CrmCampaignContactStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeCrmCampaignContact>(
			CrmCampaignContactStorage.COLLECTION,
			uuid,
		)

		return doc?.data ?? null
	}

	static async assign(
		campaignUuid: string,
		contactUuid: string,
		status?: string,
	): Promise<TypeCrmCampaignContact> {
		await CrmCampaignContactStorage.ensureIndexes()

		const link = new CrmCampaignContactModel({
			campaignUuid,
			contactUuid,
			status: status ?? '',
		})

		await MongoDBStorage._insert<TypeCrmCampaignContact>(
			CrmCampaignContactStorage.COLLECTION,
			link,
		)

		return link.getData()
	}

	static async assignBatch(
		campaignUuid: string,
		contactUuids: string[],
		status?: string,
	): Promise<{ assigned: number; skipped: number }> {
		await CrmCampaignContactStorage.ensureIndexes()

		let assigned = 0
		let skipped = 0

		for (const contactUuid of contactUuids) {
			try {
				await CrmCampaignContactStorage.assign(
					campaignUuid,
					contactUuid,
					status,
				)
				assigned++
			} catch (error: unknown) {
				if (
					typeof error === 'object' &&
					error !== null &&
					'code' in error &&
					(error as Record<string, unknown>).code === 11000
				) {
					skipped++
				} else {
					throw error
				}
			}
		}

		return { assigned, skipped }
	}

	static async updateStatus(
		campaignUuid: string,
		contactUuid: string,
		status: string,
	) {
		await CrmCampaignContactStorage.ensureIndexes()

		const collection =
			await MongoDBStorage.getCollection<TypeCrmCampaignContact>(
				CrmCampaignContactStorage.COLLECTION,
			)

		const result = await collection.findOneAndUpdate(
			{
				'data.campaignUuid': campaignUuid,
				'data.contactUuid': contactUuid,
			} as Filter<TypeDocument<TypeCrmCampaignContact>>,
			{
				$set: { 'data.status': status, _updated: new Date() },
				$inc: { _n: 1 },
			},
			{ returnDocument: 'after' },
		)

		return result?.data ?? null
	}

	static async unassign(
		campaignUuid: string,
		contactUuid: string,
	): Promise<number> {
		await CrmCampaignContactStorage.ensureIndexes()

		const result = await MongoDBStorage._deleteOne<TypeCrmCampaignContact>(
			CrmCampaignContactStorage.COLLECTION,
			{
				'data.campaignUuid': campaignUuid,
				'data.contactUuid': contactUuid,
			} as Filter<TypeDocument<TypeCrmCampaignContact>>,
		)

		return result.deletedCount
	}

	static async getContactIds(campaignUuid: string): Promise<string[]> {
		await CrmCampaignContactStorage.ensureIndexes()

		const docs = await MongoDBStorage._find<TypeCrmCampaignContact>(
			CrmCampaignContactStorage.COLLECTION,
			{ 'data.campaignUuid': campaignUuid } as Filter<TypeDocument<TypeCrmCampaignContact>>,
		)

		return docs.map((doc) => doc.data.contactUuid)
	}

	static async countByCampaign(campaignUuid: string): Promise<number> {
		await CrmCampaignContactStorage.ensureIndexes()

		return MongoDBStorage._count<TypeCrmCampaignContact>(
			CrmCampaignContactStorage.COLLECTION,
			{ 'data.campaignUuid': campaignUuid } as Filter<TypeDocument<TypeCrmCampaignContact>>,
		)
	}

	static async deleteByCampaign(campaignUuid: string) {
		await CrmCampaignContactStorage.ensureIndexes()

		return MongoDBStorage._deleteMany<TypeCrmCampaignContact>(
			CrmCampaignContactStorage.COLLECTION,
			{ 'data.campaignUuid': campaignUuid } as Filter<TypeDocument<TypeCrmCampaignContact>>,
		)
	}

	static async delete(uuid: string) {
		await CrmCampaignContactStorage.ensureIndexes()
		return MongoDBStorage._delete(
			CrmCampaignContactStorage.COLLECTION,
			uuid,
		)
	}
}
