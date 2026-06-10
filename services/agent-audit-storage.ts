import 'server-only'

import { randomUUID } from 'crypto'
import { MongoDBStorage, type TypeDocument } from '@/services/MongoDBStorage'

// 180 days in seconds
const TTL_180_DAYS = 15_552_000

export type AgentToolLogEntry = {
	timestamp: string
	userUuid: string
	userEmail: string
	toolName: string
	parameters: string
	result: string
	duration: number
	success: boolean
	error: string
}

export class AgentAuditStorage {
	static readonly COLLECTION = 'agent_tool_logs'
	private static indexesReady = false

	static async ensureIndexes() {
		if (AgentAuditStorage.indexesReady) return

		const collection = await MongoDBStorage.getCollection<AgentToolLogEntry>(
			AgentAuditStorage.COLLECTION,
		)

		await Promise.all([
			// TTL index: auto-delete documents after 180 days
			collection.createIndex({ _added: 1 }, { expireAfterSeconds: TTL_180_DAYS }),
			// Query by tool name
			collection.createIndex({ 'data.toolName': 1 }),
			// Query by user + time
			collection.createIndex({
				'data.userUuid': 1,
				'data.timestamp': -1,
			}),
		])

		AgentAuditStorage.indexesReady = true
	}

	static async logExecution(entry: AgentToolLogEntry): Promise<void> {
		await AgentAuditStorage.ensureIndexes()

		const doc: TypeDocument<AgentToolLogEntry> = {
			uuid: randomUUID(),
			data: entry,
			_added: new Date(),
			_updated: new Date(),
			_v: 1,
			_n: 0,
		}

		const collection = await MongoDBStorage.getCollection<AgentToolLogEntry>(
			AgentAuditStorage.COLLECTION,
		)
		await collection.insertOne(doc)
	}

	static async listRecent(limit = 10): Promise<AgentToolLogEntry[]> {
		await AgentAuditStorage.ensureIndexes()

		const docs = await MongoDBStorage._find<AgentToolLogEntry>(
			AgentAuditStorage.COLLECTION,
			{},
			undefined,
			{ _added: -1 },
		)

		return docs.slice(0, limit).map((doc) => doc.data)
	}

	static async listByUser(userUuid: string): Promise<AgentToolLogEntry[]> {
		await AgentAuditStorage.ensureIndexes()

		const docs = await MongoDBStorage._find<AgentToolLogEntry>(
			AgentAuditStorage.COLLECTION,
			{ 'data.userUuid': userUuid },
			undefined,
			{ 'data.timestamp': -1 },
		)

		return docs.map((doc) => doc.data)
	}
}
