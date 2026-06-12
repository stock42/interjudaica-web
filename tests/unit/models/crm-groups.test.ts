import { describe, expect, test } from 'bun:test'
import {
	CrmGroupModel,
	schemaCrmGroup,
	type TypeCrmGroup,
} from '@/models/crm-groups'

describe('schemaCrmGroup', () => {
	test('parses minimal valid input with defaults', () => {
		const parsed = schemaCrmGroup.parse({
			name: 'Argentina Enrollees',
		})
		expect(parsed.name).toBe('Argentina Enrollees')
		expect(parsed.description).toBe('')
		expect(parsed.query).toBe('')
		expect(parsed.contactCount).toBe(0)
	})

	test('parses full valid input', () => {
		const parsed = schemaCrmGroup.parse({
			name: 'New York Students',
			description: 'Students in New York who enrolled',
			query: '{"data.notes": {"$regex": "New York", "$options": "i"}}',
			contactCount: 42,
		})
		expect(parsed.name).toBe('New York Students')
		expect(parsed.description).toBe('Students in New York who enrolled')
		expect(parsed.query).toBe('{"data.notes": {"$regex": "New York", "$options": "i"}}')
		expect(parsed.contactCount).toBe(42)
	})

	test('rejects missing name', () => {
		expect(() => schemaCrmGroup.parse({})).toThrow()
	})

	test('rejects name shorter than 2 chars', () => {
		expect(() => schemaCrmGroup.parse({ name: 'A' })).toThrow()
	})

	test('rejects name longer than 300 chars', () => {
		expect(() => schemaCrmGroup.parse({ name: 'A'.repeat(301) })).toThrow()
	})

	test('rejects non-JSON query string', () => {
		expect(() =>
			schemaCrmGroup.parse({ name: 'Test', query: 'not-json' }),
		).toThrow()
	})

	test('rejects query that is a JSON array', () => {
		expect(() =>
			schemaCrmGroup.parse({ name: 'Test', query: '[]' }),
		).toThrow()
	})

	test('accepts empty query string', () => {
		const parsed = schemaCrmGroup.parse({ name: 'Test', query: '' })
		expect(parsed.query).toBe('')
	})

	test('accepts valid JSON object query', () => {
		const parsed = schemaCrmGroup.parse({
			name: 'Test',
			query: '{"data.email": {"$regex": "@gmail", "$options": "i"}}',
		})
		expect(parsed.query).toBe('{"data.email": {"$regex": "@gmail", "$options": "i"}}')
	})

	test('rejects negative contactCount', () => {
		expect(() =>
			schemaCrmGroup.parse({ name: 'Test', contactCount: -1 }),
		).toThrow()
	})

	test('rejects non-integer contactCount', () => {
		expect(() =>
			schemaCrmGroup.parse({ name: 'Test', contactCount: 3.5 }),
		).toThrow()
	})
})

function makeInput(overrides: Partial<TypeCrmGroup> = {}): TypeCrmGroup {
	return {
		name: 'Test Group',
		description: '',
		query: '',
		contactCount: 0,
		...overrides,
	}
}

describe('CrmGroupModel', () => {
	test('generates uuid and slug on construction', () => {
		const group = new CrmGroupModel(makeInput({ name: 'My Group', description: 'A test group' }))
		const data = group.getData()
		expect(data.uuid).toBeDefined()
		expect(data.uuid!.length).toBeGreaterThan(0)
		expect(data.slug).toBe('my-group')
	})

	test('preserves explicit uuid when provided', () => {
		const uuid = '123e4567-e89b-12d3-a456-426614174000'
		const group = new CrmGroupModel(makeInput({ uuid, name: 'Explicit UUID Group' }))
		expect(group.getUUID()).toBe(uuid)
		expect(group.getData().uuid).toBe(uuid)
	})

	test('getUUID returns uuid string', () => {
		const group = new CrmGroupModel(makeInput())
		const uuid = group.getUUID()
		expect(typeof uuid).toBe('string')
		expect(uuid.length).toBeGreaterThan(0)
	})

	test('getData returns full model data', () => {
		const group = new CrmGroupModel(makeInput({
			name: 'Full Test',
			description: 'Description here',
			query: '{}',
			contactCount: 5,
		}))
		const data = group.getData()
		expect(data.name).toBe('Full Test')
		expect(data.description).toBe('Description here')
		expect(data.query).toBe('{}')
		expect(data.contactCount).toBe(5)
		expect(data.slug).toBe('full-test')
	})

	test('slugifies name with special characters', () => {
		const group = new CrmGroupModel(makeInput({ name: '¡Grupo en Español!' }))
		expect(group.getData().slug).toBe('grupo-en-espanol')
	})

	test('trim whitespace from name', () => {
		const group = new CrmGroupModel(makeInput({ name: '  Trimmed Name  ' }))
		expect(group.getData().name).toBe('Trimmed Name')
	})

	test('contactCount defaults to 0', () => {
		const group = new CrmGroupModel(makeInput({ name: 'No Count' }))
		expect(group.getData().contactCount).toBe(0)
	})
})
