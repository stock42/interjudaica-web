import { describe, expect, test } from 'bun:test'
import { OwnerBioModel, schemaOwnerBio } from '@/models/owner-bio'

describe('OwnerBioModel', () => {
	test('creates valid data with Ernesto Yattah defaults', () => {
		const model = new OwnerBioModel({})
		const data = model.getData()

		expect(data.title).toBe('Ernesto Yattah')
		expect(data.slug).toBe('ernesto-yattah')
		expect(data.markdown).toBe('')
		expect(data.updatedAt).toBe('')
		expect(data.uuid).toBeString()
		expect(data.uuid.length).toBeGreaterThan(0)
	})

	test('schemaOwnerBio parses empty object with correct defaults', () => {
		const parsed = schemaOwnerBio.parse({})
		expect(parsed.title).toBe('Ernesto Yattah')
		expect(parsed.slug).toBe('ernesto-yattah')
	})

	test('schemaOwnerBio preserves custom title', () => {
		const parsed = schemaOwnerBio.parse({ title: 'Custom Title' })
		expect(parsed.title).toBe('Custom Title')
		expect(parsed.slug).toBe('ernesto-yattah')
	})

	test('generates a UUID', () => {
		const model1 = new OwnerBioModel({})
		const model2 = new OwnerBioModel({})
		expect(model1.getUUID()).not.toBe(model2.getUUID())
	})
})
