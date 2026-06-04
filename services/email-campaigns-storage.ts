import 'server-only'

import {
	EmailCampaignModel,
	type TypeEmailCampaign,
} from '@/models/email-campaigns'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class EmailCampaignStorage extends MongoDBStorage<TypeEmailCampaign> {
	static readonly COLLECTION = 'email_campaigns'
	private static indexesReady = false

	constructor() {
		super(EmailCampaignStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (EmailCampaignStorage.indexesReady) return
		const collection =
			await MongoDBStorage.getCollection<TypeEmailCampaign>(
				EmailCampaignStorage.COLLECTION,
			)
		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ 'data.slug': 1 }, { unique: true }),
			collection.createIndex({ 'data.status': 1 }),
			collection.createIndex({ 'data.templateUuid': 1 }),
			collection.createIndex({ 'data.groupUuid': 1 }),
		])
		EmailCampaignStorage.indexesReady = true
	}

	static async list() {
		await EmailCampaignStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeEmailCampaign>(
			EmailCampaignStorage.COLLECTION,
			{},
			undefined,
			{ 'data.name': 1 },
		)
		return docs.map((doc) => doc.data)
	}

	static async get(uuid: string) {
		await EmailCampaignStorage.ensureIndexes()
		const doc = await MongoDBStorage._getByUUID<TypeEmailCampaign>(
			EmailCampaignStorage.COLLECTION,
			uuid,
		)
		return doc?.data ?? null
	}

	static async create(input: Partial<TypeEmailCampaign>) {
		await EmailCampaignStorage.ensureIndexes()
		const campaign = new EmailCampaignModel(input as TypeEmailCampaign)
		await MongoDBStorage._insert<TypeEmailCampaign>(
			EmailCampaignStorage.COLLECTION,
			campaign,
		)
		return campaign.getData()
	}

	static async update(uuid: string, input: Partial<TypeEmailCampaign>) {
		await EmailCampaignStorage.ensureIndexes()
		const existing = await MongoDBStorage._getByUUID<TypeEmailCampaign>(
			EmailCampaignStorage.COLLECTION,
			uuid,
		)
		if (!existing) return null
		const campaign = new EmailCampaignModel({
			...existing.data,
			...input,
			uuid,
		})
		await MongoDBStorage._replaceData<TypeEmailCampaign>(
			EmailCampaignStorage.COLLECTION,
			uuid,
			campaign.getData(),
		)
		return campaign.getData()
	}

	static async delete(uuid: string) {
		await EmailCampaignStorage.ensureIndexes()
		// Cascade delete spooler entries
		const { EmailSpoolerStorage } = await import(
			'@/services/email-spooler-storage'
		)
		await EmailSpoolerStorage.deleteByCampaign(uuid)
		return MongoDBStorage._delete(EmailCampaignStorage.COLLECTION, uuid)
	}

	static async getStats(campaignUuid: string) {
		await EmailCampaignStorage.ensureIndexes()
		const { EmailSpoolerStorage } = await import(
			'@/services/email-spooler-storage'
		)
		const stats = await EmailSpoolerStorage.getStats(campaignUuid)
		return {
			total: stats.total ?? 0,
			sent: stats.sent ?? 0,
			error: stats.error ?? 0,
			new: (stats.total ?? 0) - ((stats.sent ?? 0) + (stats.error ?? 0)),
		}
	}
}
