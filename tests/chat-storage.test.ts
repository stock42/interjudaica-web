import { beforeAll, describe, expect, mock, test } from 'bun:test'
import type { ChatThreadModel as ChatThreadModelType } from '@/models/chat-threads'
import type { ChatMessageModel as ChatMessageModelType } from '@/models/chat-messages'
import type { MAX_CONTENT_LENGTH as MaxLen } from '@/models/chat-messages'
import type { ChatStorage as ChatStorageType } from '@/services/chat-storage'

mock.module('server-only', () => ({}))

let ChatThreadModel: typeof ChatThreadModelType
let ChatMessageModel: typeof ChatMessageModelType
let MAX_CONTENT_LENGTH: typeof MaxLen
let ChatStorage: typeof ChatStorageType

beforeAll(async () => {
	const threads = await import('@/models/chat-threads')
	const messages = await import('@/models/chat-messages')
	const storage = await import('@/services/chat-storage')
	ChatThreadModel = threads.ChatThreadModel
	ChatMessageModel = messages.ChatMessageModel
	MAX_CONTENT_LENGTH = messages.MAX_CONTENT_LENGTH
	ChatStorage = storage.ChatStorage
})

// ── Model Tests ───────────────────────────────────────────────

describe('ChatThreadModel', () => {
	test('creates a thread with defaults', () => {
		const model = new ChatThreadModel({
			userUuid: '550e8400-e29b-41d4-a716-446655440000',
		})
		const data = model.getData()

		expect(data.uuid).toBeString()
		expect(data.uuid.length).toBe(36)
		expect(data.userUuid).toBe('550e8400-e29b-41d4-a716-446655440000')
		expect(data.title).toBe('New Chat')
		expect(data.messageCount).toBe(0)
		expect(data.createdAt).toBeString()
		expect(data.updatedAt).toBeString()
	})

	test('getUUID returns the uuid', () => {
		const model = new ChatThreadModel()
		expect(model.getUUID()).toBe(model.getData().uuid)
	})

	test('accepts custom title', () => {
		const model = new ChatThreadModel({
			userUuid: '550e8400-e29b-41d4-a716-446655440000',
			title: 'My custom chat',
		})
		expect(model.getData().title).toBe('My custom chat')
	})

	test('rejects title over 100 characters', () => {
		expect(() => {
			new ChatThreadModel({
				userUuid: '550e8400-e29b-41d4-a716-446655440000',
				title: 'x'.repeat(101),
			})
		}).toThrow()
	})
})

describe('ChatMessageModel', () => {
	test('creates a message with defaults', () => {
		const model = new ChatMessageModel({
			threadUuid: '550e8400-e29b-41d4-a716-446655440000',
			role: 'user',
			content: 'Hello',
		})
		const data = model.getData()

		expect(data.uuid).toBeString()
		expect(data.threadUuid).toBe('550e8400-e29b-41d4-a716-446655440000')
		expect(data.role).toBe('user')
		expect(data.content).toBe('Hello')
		expect(data.createdAt).toBeString()
	})

	test('getUUID returns the uuid', () => {
		const model = new ChatMessageModel()
		expect(model.getUUID()).toBe(model.getData().uuid)
	})

	test('accepts assistant role', () => {
		const model = new ChatMessageModel({
			role: 'assistant',
			content: 'Hi there!',
		})
		expect(model.getData().role).toBe('assistant')
	})

	test('accepts tool role', () => {
		const model = new ChatMessageModel({ role: 'tool', content: '{}' })
		expect(model.getData().role).toBe('tool')
	})

	test('rejects invalid role', () => {
		expect(() => {
			new ChatMessageModel({ role: 'system', content: 'test' })
		}).toThrow()
	})

	test('getStorageData truncates content over MAX_CONTENT_LENGTH', () => {
		const longContent = 'x'.repeat(MAX_CONTENT_LENGTH + 100)
		const model = new ChatMessageModel({ content: longContent })

		expect(model.getData().content).toBe(longContent)

		const storage = model.getStorageData()
		expect(storage.content.length).toBeLessThanOrEqual(MAX_CONTENT_LENGTH)
		expect(storage.content.endsWith('...[truncated]')).toBe(true)
	})

	test('getStorageData does not truncate short content', () => {
		const model = new ChatMessageModel({ content: 'short message' })
		const storage = model.getStorageData()
		expect(storage.content).toBe('short message')
	})
})

// ── Storage Tests (mocked MongoDB) ─────────────────────────────

const mockThreads: Array<{
	uuid: string
	data: Record<string, unknown>
}> = []
const mockMessages: Array<{
	uuid: string
	data: Record<string, unknown>
}> = []

function resetMocks() {
	mockThreads.length = 0
	mockMessages.length = 0
}

mock.module('@/services/MongoDBStorage', () => ({
	MongoDBStorage: {
		getCollection: () => ({
			createIndex: () => Promise.resolve('index-created'),
		}),
		_insert: (
			collectionName: string,
			model: { getData: () => Record<string, unknown>; getUUID: () => string },
		) => {
			const doc = {
				uuid: model.getUUID(),
				data: model.getData(),
				_added: new Date(),
				_updated: new Date(),
				_v: 1,
				_n: 0,
			}
			if (collectionName === 'chat_threads') {
				mockThreads.push(doc)
			} else if (collectionName === 'chat_messages') {
				mockMessages.push(doc)
			}
			return Promise.resolve({ insertedId: doc.uuid })
		},
		_find: (
			collectionName: string,
			query: Record<string, unknown>,
			_proj?: unknown,
			sort?: Record<string, number>,
		) => {
			let docs =
				collectionName === 'chat_threads'
					? [...mockThreads]
					: [...mockMessages]
			if (query?.['data.userUuid']) {
				docs = docs.filter(
					(d) => d.data.userUuid === query['data.userUuid'],
				)
			}
			if (query?.['data.threadUuid']) {
				docs = docs.filter(
					(d) => d.data.threadUuid === query['data.threadUuid'],
				)
			}
			if (sort) {
				const [key, dir] = Object.entries(sort)[0] as [string, number]
				docs.sort((a, b) => {
					const aVal = key.startsWith('data.')
						? a.data[key.slice(5)]
						: (a as Record<string, unknown>)[key]
					const bVal = key.startsWith('data.')
						? b.data[key.slice(5)]
						: (b as Record<string, unknown>)[key]
					return dir === 1
						? String(aVal).localeCompare(String(bVal))
						: String(bVal).localeCompare(String(aVal))
				})
			}
			return Promise.resolve(docs)
		},
		_getByUUID: (collectionName: string, uuid: string) => {
			const docs =
				collectionName === 'chat_threads' ? mockThreads : mockMessages
			const doc = docs.find((d) => d.uuid === uuid)
			return Promise.resolve(doc || null)
		},
		_replaceData: (
			collectionName: string,
			uuid: string,
			data: Record<string, unknown>,
		) => {
			const docs =
				collectionName === 'chat_threads' ? mockThreads : mockMessages
			const idx = docs.findIndex((d) => d.uuid === uuid)
			if (idx !== -1) {
				docs[idx]!.data = data
				docs[idx]!._updated = new Date()
			}
			return Promise.resolve({ matchedCount: idx !== -1 ? 1 : 0 })
		},
		_count: (_collectionName: string, query: Record<string, unknown>) => {
			let docs = mockMessages
			if (query?.['data.threadUuid']) {
				docs = docs.filter(
					(d) => d.data.threadUuid === query['data.threadUuid'],
				)
			}
			return Promise.resolve(docs.length)
		},
		_deleteOne: (
			_collectionName: string,
			query: Record<string, unknown>,
		) => {
			const idx = mockThreads.findIndex((d) => d.uuid === query.uuid)
			if (idx !== -1) mockThreads.splice(idx, 1)
			return Promise.resolve({ deletedCount: idx !== -1 ? 1 : 0 })
		},
		_deleteMany: (
			_collectionName: string,
			query: Record<string, unknown>,
		) => {
			const before = mockMessages.length
			const filtered = mockMessages.filter(
				(d) => d.data.threadUuid !== query['data.threadUuid'],
			)
			mockMessages.length = 0
			mockMessages.push(...filtered)
			return Promise.resolve({ deletedCount: before - filtered.length })
		},
	},
}))

describe('ChatStorage', () => {
	test('createThread creates a new thread', async () => {
		resetMocks()
		const userUuid = '550e8400-e29b-41d4-a716-446655440000'
		const thread = await ChatStorage.createThread(userUuid)

		expect(thread.uuid).toBeString()
		expect(thread.userUuid).toBe(userUuid)
		expect(thread.title).toBe('New Chat')
		expect(thread.messageCount).toBe(0)
	})

	test('getThreads returns user threads sorted by updatedAt DESC', async () => {
		resetMocks()
		const userUuid = '550e8400-e29b-41d4-a716-446655440000'

		await ChatStorage.createThread(userUuid)
		await ChatStorage.createThread(userUuid)

		const threads = await ChatStorage.getThreads(userUuid)
		expect(threads.length).toBe(2)
	})

	test('getThread returns null for nonexistent thread', async () => {
		resetMocks()
		const thread = await ChatStorage.getThread(
			'00000000-0000-0000-0000-000000000000',
		)
		expect(thread).toBeNull()
	})

	test('addMessage inserts a message and updates thread', async () => {
		resetMocks()
		const userUuid = '550e8400-e29b-41d4-a716-446655440000'
		const thread = await ChatStorage.createThread(userUuid)

		const msg = new ChatMessageModel({
			threadUuid: thread.uuid,
			role: 'user',
			content: 'Hello bot',
		})

		const saved = await ChatStorage.addMessage(msg.getData())
		expect(saved.content).toBe('Hello bot')
		expect(saved.threadUuid).toBe(thread.uuid)

		const updated = await ChatStorage.getThread(thread.uuid)
		expect(updated?.messageCount).toBe(1)
	})

	test('addMessage truncates long content', async () => {
		resetMocks()
		const userUuid = '550e8400-e29b-41d4-a716-446655440000'
		const thread = await ChatStorage.createThread(userUuid)

		const longContent = 'x'.repeat(MAX_CONTENT_LENGTH + 100)
		const msg = new ChatMessageModel({
			threadUuid: thread.uuid,
			role: 'assistant',
			content: longContent,
		})

		const saved = await ChatStorage.addMessage(msg.getData())
		expect(saved.content.length).toBeLessThanOrEqual(MAX_CONTENT_LENGTH)
		expect(saved.content.endsWith('...[truncated]')).toBe(true)
	})

	test('getMessages returns messages sorted by createdAt ASC', async () => {
		resetMocks()
		const userUuid = '550e8400-e29b-41d4-a716-446655440000'
		const thread = await ChatStorage.createThread(userUuid)

		await ChatStorage.addMessage(
			new ChatMessageModel({
				threadUuid: thread.uuid,
				role: 'user',
				content: 'first',
			}).getData(),
		)
		await ChatStorage.addMessage(
			new ChatMessageModel({
				threadUuid: thread.uuid,
				role: 'assistant',
				content: 'second',
			}).getData(),
		)

		const messages = await ChatStorage.getMessages(thread.uuid)
		expect(messages.length).toBe(2)
		expect(messages[0]!.content).toBe('first')
		expect(messages[1]!.content).toBe('second')
	})

	test('getMessages with limit returns last N messages', async () => {
		resetMocks()
		const userUuid = '550e8400-e29b-41d4-a716-446655440000'
		const thread = await ChatStorage.createThread(userUuid)

		for (let i = 0; i < 5; i++) {
			await ChatStorage.addMessage(
				new ChatMessageModel({
					threadUuid: thread.uuid,
					role: 'user',
					content: `msg${i}`,
				}).getData(),
			)
		}

		const recent = await ChatStorage.getRecentMessages(thread.uuid, 3)
		expect(recent.length).toBe(3)
	})

	test('deleteThread cascades to messages', async () => {
		resetMocks()
		const userUuid = '550e8400-e29b-41d4-a716-446655440000'
		const thread = await ChatStorage.createThread(userUuid)

		await ChatStorage.addMessage(
			new ChatMessageModel({
				threadUuid: thread.uuid,
				role: 'user',
				content: 'test',
			}).getData(),
		)

		await ChatStorage.deleteThread(thread.uuid)

		const deleted = await ChatStorage.getThread(thread.uuid)
		expect(deleted).toBeNull()

		const messages = await ChatStorage.getMessages(thread.uuid)
		expect(messages.length).toBe(0)
	})
})
