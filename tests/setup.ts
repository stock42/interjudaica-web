import { mock } from 'bun:test'

mock.module('server-only', () => ({}))

function matchQuery(item: Record<string, unknown>, query: Record<string, unknown>): boolean {
	return Object.entries(query).every(([key, value]) => item[key] === value)
}

export function createMockCollection() {
	const items: Record<string, unknown>[] = []

	return {
		items,

		findOne: mock(async (query: Record<string, unknown>) => {
			return items.find(item => matchQuery(item, query)) ?? null
		}),

		find: mock(async (query: Record<string, unknown> = {}) => {
			return {
				toArray: mock(async () =>
					items.filter(item => matchQuery(item, query)),
				),
			}
		}),

		insertOne: mock(async (doc: Record<string, unknown>) => {
			const record = { ...doc, _id: `mock-${items.length + 1}` }
			items.push(record)
			return { insertedId: record._id }
		}),

		updateOne: mock(
			async (
				query: Record<string, unknown>,
				update: Record<string, unknown>,
			) => {
				const idx = items.findIndex(item => matchQuery(item, query))
				if (idx === -1) return { matchedCount: 0, modifiedCount: 0 }
				const set =
					(update as { $set?: Record<string, unknown> }).$set ?? {}
				items[idx] = { ...items[idx], ...set }
				return { matchedCount: 1, modifiedCount: 1 }
			},
		),

		deleteOne: mock(async (query: Record<string, unknown>) => {
			const idx = items.findIndex(item => matchQuery(item, query))
			if (idx === -1) return { deletedCount: 0 }
			items.splice(idx, 1)
			return { deletedCount: 1 }
		}),

		deleteMany: mock(async (query: Record<string, unknown> = {}) => {
			const before = items.length
			const remaining = items.filter(item => !matchQuery(item, query))
			items.length = 0
			items.push(...remaining)
			return { deletedCount: before - remaining.length }
		}),
	}
}

export type MockCollection = ReturnType<typeof createMockCollection>

export function mockDb(
	collections?: Record<string, MockCollection>,
) {
	const registry = collections ?? {}

	return {
		collection: (name: string): MockCollection => {
			if (!registry[name]) {
				registry[name] = createMockCollection()
			}
			return registry[name]
		},
	}
}
