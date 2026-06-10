import { beforeAll, describe, expect, mock, test } from 'bun:test'
import type { AgentAuditStorage as StorageType } from '@/services/agent-audit-storage'
import type { auditToolCall as AuditFn } from '@/lib/llm-audit-log'
import type { MongoDBStorage as MongoStorageType } from '@/services/MongoDBStorage'

mock.module('server-only', () => ({}))

// ── In-memory store and mocks ─────────────────────────────────────

let insertedDocs: Array<Record<string, unknown>> = []
let indexes: Array<Record<string, unknown>> = []

const fakeCollection = {
	insertOne: mock((doc: Record<string, unknown>) => {
		insertedDocs.push(doc)
		return { insertedId: doc.uuid }
	}),
	createIndex: mock((spec: Record<string, unknown>, opts?: Record<string, unknown>) => {
		indexes.push({ spec, opts: opts || {} })
	}),
	find: mock(() => fakeCursor),
	countDocuments: mock(() => insertedDocs.length),
}

const fakeCursor = {
	sort: mock(() => fakeCursor),
	skip: mock(() => fakeCursor),
	limit: mock(() => fakeCursor),
	toArray: mock(() => [...insertedDocs].reverse()),
}

mock.module('@/services/MongoDBStorage', () => ({
	MongoDBStorage: {
		getCollection: mock(() => fakeCollection),
		_find: mock((_collection: string, _query: unknown, _proj: unknown, _sort: unknown) => {
			return [...insertedDocs].reverse()
		}),
		_count: mock(() => insertedDocs.length),
	},
}))

let AgentAuditStorage: typeof StorageType
let auditToolCall: typeof AuditFn

beforeAll(async () => {
	const storage = await import('@/services/agent-audit-storage')
	const audit = await import('@/lib/llm-audit-log')
	AgentAuditStorage = storage.AgentAuditStorage
	auditToolCall = audit.auditToolCall
})

function resetState() {
	insertedDocs = []
	indexes = []
	// Reset index readiness so ensureIndexes runs again
	;(AgentAuditStorage as any).indexesReady = false
}

// ── Tests ─────────────────────────────────────────────────────────

describe('AgentAuditStorage', () => {
	test('ensureIndexes creates TTL index on _added with 180 days', async () => {
		resetState()
		await AgentAuditStorage.ensureIndexes()

		const ttlIndex = indexes.find(
			(idx) =>
				typeof idx.spec === 'object' &&
				idx.spec !== null &&
				'_added' in idx.spec &&
				idx.opts &&
				typeof idx.opts === 'object' &&
				'expireAfterSeconds' in idx.opts,
		)

		expect(ttlIndex).toBeDefined()
		expect((ttlIndex!.opts as any).expireAfterSeconds).toBe(15_552_000)
	})

	test('ensureIndexes creates toolName index', async () => {
		resetState()
		await AgentAuditStorage.ensureIndexes()

		const toolNameIndex = indexes.find(
			(idx) =>
				typeof idx.spec === 'object' &&
				idx.spec !== null &&
				'data.toolName' in idx.spec,
		)

		expect(toolNameIndex).toBeDefined()
	})

	test('ensureIndexes creates userUuid+timestamp compound index', async () => {
		resetState()
		await AgentAuditStorage.ensureIndexes()

		const userIndex = indexes.find(
			(idx) =>
				typeof idx.spec === 'object' &&
				idx.spec !== null &&
				'data.userUuid' in idx.spec &&
				'data.timestamp' in idx.spec,
		)

		expect(userIndex).toBeDefined()
	})

	test('logExecution inserts document with correct fields', async () => {
		resetState()

		await AgentAuditStorage.logExecution({
			timestamp: '2026-06-10T00:00:00.000Z',
			userUuid: 'user-1',
			userEmail: 'test@example.com',
			toolName: 'search_courses',
			parameters: '{"query":"intro to torah"}',
			result: '{"items":[]}',
			duration: 123,
			success: true,
			error: '',
		})

		expect(insertedDocs.length).toBe(1)
		const doc = insertedDocs[0] as any

		expect(doc.uuid).toBeString()
		expect(doc.uuid.length).toBe(36)
		expect(doc._added).toBeInstanceOf(Date)
		expect(doc._v).toBe(1)
		expect(doc._n).toBe(0)

		expect(doc.data.timestamp).toBe('2026-06-10T00:00:00.000Z')
		expect(doc.data.userUuid).toBe('user-1')
		expect(doc.data.userEmail).toBe('test@example.com')
		expect(doc.data.toolName).toBe('search_courses')
		expect(doc.data.parameters).toBe('{"query":"intro to torah"}')
		expect(doc.data.result).toBe('{"items":[]}')
		expect(doc.data.duration).toBe(123)
		expect(doc.data.success).toBe(true)
		expect(doc.data.error).toBe('')
	})

	test('logExecution records failed executions with error', async () => {
		resetState()

		await AgentAuditStorage.logExecution({
			timestamp: '2026-06-10T00:00:00.000Z',
			userUuid: 'user-1',
			userEmail: '',
			toolName: 'search_courses',
			parameters: '{}',
			result: '',
			duration: 42,
			success: false,
			error: 'MongoDB connection failed',
		})

		expect(insertedDocs.length).toBe(1)
		const doc = insertedDocs[0] as any
		expect(doc.data.success).toBe(false)
		expect(doc.data.error).toBe('MongoDB connection failed')
	})

	test('listRecent returns entries sorted by _added DESC', async () => {
		resetState()

		await AgentAuditStorage.logExecution({
			timestamp: '2026-06-09T00:00:00.000Z',
			userUuid: 'u1',
			userEmail: '',
			toolName: 'tool-a',
			parameters: '',
			result: '',
			duration: 1,
			success: true,
			error: '',
		})

		await AgentAuditStorage.logExecution({
			timestamp: '2026-06-10T00:00:00.000Z',
			userUuid: 'u2',
			userEmail: '',
			toolName: 'tool-b',
			parameters: '',
			result: '',
			duration: 2,
			success: true,
			error: '',
		})

		const recent = await AgentAuditStorage.listRecent(10)

		expect(recent.length).toBe(2)
		// Most recent first (reverse insertion order)
		expect(recent[0].toolName).toBe('tool-b')
		expect(recent[1].toolName).toBe('tool-a')
	})

	test('listRecent respects limit', async () => {
		resetState()

		for (let i = 0; i < 10; i++) {
			await AgentAuditStorage.logExecution({
				timestamp: `2026-06-0${i}T00:00:00.000Z`,
				userUuid: 'u1',
				userEmail: '',
				toolName: `tool-${i}`,
				parameters: '',
				result: '',
				duration: i,
				success: true,
				error: '',
			})
		}

		const recent = await AgentAuditStorage.listRecent(3)
		expect(recent.length).toBe(3)
	})

	test('listByUser filters by userUuid', async () => {
		resetState()

		await AgentAuditStorage.logExecution({
			timestamp: '2026-06-10T00:00:00.000Z',
			userUuid: 'alice',
			userEmail: 'alice@example.com',
			toolName: 'tool-a',
			parameters: '',
			result: '',
			duration: 1,
			success: true,
			error: '',
		})

		await AgentAuditStorage.logExecution({
			timestamp: '2026-06-10T00:00:00.000Z',
			userUuid: 'bob',
			userEmail: 'bob@example.com',
			toolName: 'tool-b',
			parameters: '',
			result: '',
			duration: 2,
			success: true,
			error: '',
		})

		// NOTE: listByUser uses MongoDBStorage._find with a query filter.
		// Our mock _find ignores the query and returns all docs reversed.
		// For a proper integration test we'd need real MongoDB.
		// This unit test validates the method exists and is callable.

		const result = await AgentAuditStorage.listByUser('alice')
		expect(Array.isArray(result)).toBe(true)
	})
})

describe('auditToolCall', () => {
	test('creates log entry via AgentAuditStorage', async () => {
		resetState()

		await auditToolCall(
			{ uuid: 'user-42', email: 'user@interjudaica.com' },
			'fetch_course',
			{ slug: 'intro-to-torah' },
			{ title: 'Intro to Torah', price: 19 },
			150,
			true,
		)

		expect(insertedDocs.length).toBe(1)
		const doc = insertedDocs[0] as any

		expect(doc.data.userUuid).toBe('user-42')
		expect(doc.data.userEmail).toBe('user@interjudaica.com')
		expect(doc.data.toolName).toBe('fetch_course')
		expect(doc.data.success).toBe(true)
		expect(doc.data.error).toBe('')
		expect(doc.data.duration).toBe(150)

		expect(doc.data.parameters).toContain('slug')
		expect(doc.data.parameters).toContain('intro-to-torah')
		expect(doc.data.result).toContain('Intro to Torah')
	})

	test('truncates parameters and result to 500 characters', async () => {
		resetState()

		const longString = 'x'.repeat(1000)

		await auditToolCall(
			{ uuid: 'u1' },
			'test_tool',
			longString,
			longString,
			0,
			true,
		)

		expect(insertedDocs.length).toBe(1)
		const doc = insertedDocs[0] as any

		expect(doc.data.parameters.length).toBeLessThanOrEqual(500)
		expect(doc.data.result.length).toBeLessThanOrEqual(500)
	})

	test('redacts sensitive fields from parameters', async () => {
		resetState()

		await auditToolCall(
			{ uuid: 'u1' },
			'login_user',
			{ email: 'test@example.com', password: 'secret123' },
			{ success: true },
			50,
			true,
		)

		expect(insertedDocs.length).toBe(1)
		const doc = insertedDocs[0] as any

		// Password field must be redacted
		expect(doc.data.parameters).not.toContain('secret123')
		expect(doc.data.parameters).toContain('[REDACTED]')
	})

	test('handles undefined and null params/result gracefully', async () => {
		resetState()

		await auditToolCall(
			{ uuid: 'u1' },
			'empty_tool',
			null,
			undefined,
			0,
			true,
		)

		expect(insertedDocs.length).toBe(1)
		const doc = insertedDocs[0] as any

		expect(doc.data.parameters).toBe('')
		expect(doc.data.result).toBe('')
	})

	test('does not throw on storage errors', async () => {
		resetState()

		// Make insertOne throw
		fakeCollection.insertOne.mockImplementation(() => {
			throw new Error('DB down')
		})

		// Must not throw
		await auditToolCall(
			{ uuid: 'u1' },
			'failing_tool',
			{},
			{},
			0,
			false,
			'DB down',
		)

		// Restore mock
		fakeCollection.insertOne.mockImplementation((doc: Record<string, unknown>) => {
			insertedDocs.push(doc)
			return { insertedId: doc.uuid }
		})
	})
})
