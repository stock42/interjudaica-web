import 'server-only'

import {
	CrmCampaignModel,
	type TypeCrmCampaign,
} from '@/models/crm-campaigns'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class CrmCampaignStorage extends MongoDBStorage<TypeCrmCampaign> {
	static readonly COLLECTION = 'crm_campaigns'
	private static indexesReady = false

	constructor() {
		super(CrmCampaignStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (CrmCampaignStorage.indexesReady) {
			return
		}

		const collection = await MongoDBStorage.getCollection<TypeCrmCampaign>(
			CrmCampaignStorage.COLLECTION,
		)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.slug': 1 }, { unique: true }),
			collection.createIndex({ 'data.name': 'text' }),
		])

		CrmCampaignStorage.indexesReady = true
	}

	static async list() {
		await CrmCampaignStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeCrmCampaign>(
			CrmCampaignStorage.COLLECTION,
			{},
			undefined,
			{ 'data.name': 1 },
		)
		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await CrmCampaignStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeCrmCampaign>(
			CrmCampaignStorage.COLLECTION,
			uuid,
		)
		return doc?.data ?? null
	}

	static async create(input: Partial<TypeCrmCampaign>) {
		await CrmCampaignStorage.ensureIndexes()
		const campaign = new CrmCampaignModel(input as TypeCrmCampaign)
		await MongoDBStorage._insert<TypeCrmCampaign>(
			CrmCampaignStorage.COLLECTION,
			campaign,
		)
		return campaign.getData()
	}

	static async update(uuid: string, input: Partial<TypeCrmCampaign>) {
		await CrmCampaignStorage.ensureIndexes()
		const existing = await MongoDBStorage._getByUUID<TypeCrmCampaign>(
			CrmCampaignStorage.COLLECTION,
			uuid,
		)

		if (!existing) {
			return null
		}

		const campaign = new CrmCampaignModel({
			...existing.data,
			...input,
			uuid,
		})

		await MongoDBStorage._replaceData<TypeCrmCampaign>(
			CrmCampaignStorage.COLLECTION,
			uuid,
			campaign.getData(),
		)

		return campaign.getData()
	}

	static async delete(uuid: string) {
		await CrmCampaignStorage.ensureIndexes()

		const { CrmCampaignContactStorage } = await import(
			'@/services/crm-campaign-contacts-storage'
		)
		await CrmCampaignContactStorage.deleteByCampaign(uuid)

		return MongoDBStorage._delete(CrmCampaignStorage.COLLECTION, uuid)
	}
}
