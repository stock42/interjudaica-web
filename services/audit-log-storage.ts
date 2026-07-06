import 'server-only'

import {
	AuditLogModel,
	type TypeAuditLog,
	type TypeAuditLogInput,
} from '@/models/audit-logs'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class AuditLogStorage {
	static readonly COLLECTION = 'audit_logs'
	private static indexesReady = false

	static async ensureIndexes() {
		if (AuditLogStorage.indexesReady) return
		const collection = await MongoDBStorage.getCollection<TypeAuditLog>(
			AuditLogStorage.COLLECTION,
		)
		await Promise.all([
			collection.createIndex({ 'data.action': 1 }),
			collection.createIndex({ 'data.email': 1 }),
			collection.createIndex({ 'data.actorKind': 1, 'data.actorUuid': 1 }),
			collection.createIndex({ 'data.subjectType': 1, 'data.subjectUuid': 1 }),
			collection.createIndex({ 'data.courseUuid': 1, 'data.classUuid': 1 }),
			collection.createIndex({ 'data.createdAt': -1 }),
		])
		AuditLogStorage.indexesReady = true
	}

	static async log(params: TypeAuditLogInput) {
		await AuditLogStorage.ensureIndexes()
		const log = new AuditLogModel(params)
		await MongoDBStorage._insert<TypeAuditLog>(AuditLogStorage.COLLECTION, log)
		return log.getData()
	}

	static async listRecent(limit = 100) {
		await AuditLogStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeAuditLog>(
			AuditLogStorage.COLLECTION,
			{},
			undefined,
			{ 'data.createdAt': -1 },
		)

		return docs.slice(0, limit).map(doc => doc.data)
	}
}
