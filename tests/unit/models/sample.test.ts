import { describe, expect, test } from 'bun:test'
import { createMockCollection, mockDb } from '../../setup'

describe('mockDb (setup)', () => {
	test('createMockCollection starts empty', () => {
		const col = createMockCollection()
		expect(col.items).toEqual([])
	})

	test('insertOne adds an item', async () => {
		const col = createMockCollection()
		await col.insertOne({ name: 'Test', value: 42 })
		expect(col.items.length).toBe(1)
		expect(col.items[0]!.name).toBe('Test')
	})

	test('findOne returns inserted item', async () => {
		const col = createMockCollection()
		await col.insertOne({ uuid: 'abc', title: 'Hello' })
		const result = await col.findOne({ uuid: 'abc' })
		expect(result).not.toBeNull()
		expect((result as { title: string }).title).toBe('Hello')
	})

	test('findOne returns null for missing item', async () => {
		const col = createMockCollection()
		const result = await col.findOne({ uuid: 'nope' })
		expect(result).toBeNull()
	})

	test('updateOne modifies matching item', async () => {
		const col = createMockCollection()
		await col.insertOne({ uuid: 'x', status: 'draft' })
		await col.updateOne(
			{ uuid: 'x' },
			{ $set: { status: 'published' } },
		)
		const updated = await col.findOne({ uuid: 'x' })
		expect((updated as { status: string }).status).toBe('published')
	})

	test('deleteOne removes matching item', async () => {
		const col = createMockCollection()
		await col.insertOne({ uuid: 'del-me' })
		const result = await col.deleteOne({ uuid: 'del-me' })
		expect((result as { deletedCount: number }).deletedCount).toBe(1)
		expect(col.items.length).toBe(0)
	})

	test('mockDb creates collections on demand', () => {
		const db = mockDb()
		const users = db.collection('users')
		expect(users.items).toEqual([])
	})

	test('mockDb reuses same collection instance', () => {
		const db = mockDb()
		const col1 = db.collection('courses')
		const col2 = db.collection('courses')
		expect(col1).toBe(col2)
	})

	test('find with toArray returns filtered items', async () => {
		const col = createMockCollection()
		await col.insertOne({ type: 'A', value: 1 })
		await col.insertOne({ type: 'B', value: 2 })
		await col.insertOne({ type: 'A', value: 3 })
		const cursor = await col.find({ type: 'A' })
		const results = await (
			cursor as { toArray: () => Promise<unknown[]> }
		).toArray()
		expect(results.length).toBe(2)
	})

	test('deleteMany removes all matching items', async () => {
		const col = createMockCollection()
		await col.insertOne({ status: 'active' })
		await col.insertOne({ status: 'active' })
		await col.insertOne({ status: 'inactive' })
		const result = await col.deleteMany({ status: 'active' })
		expect((result as { deletedCount: number }).deletedCount).toBe(2)
		expect(col.items.length).toBe(1)
	})
})
