import { describe, expect, test } from 'bun:test'
import { schemaConfigUpdate } from '@/models/config-schema'

describe('schemaConfigUpdate', () => {
	test('accepts a valid number key with a numeric value', () => {
		const result = schemaConfigUpdate.safeParse({
			upload_image_max_size_mb: '10',
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.upload_image_max_size_mb).toBe(10)
		}
	})

	test('accepts a valid number key with a raw number value', () => {
		const result = schemaConfigUpdate.safeParse({
			upload_image_max_size_mb: 10,
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.upload_image_max_size_mb).toBe(10)
		}
	})

	test('accepts a valid string key', () => {
		const result = schemaConfigUpdate.safeParse({
			currency: 'eur',
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.currency).toBe('eur')
		}
	})

	test('accepts multiple valid keys together', () => {
		const result = schemaConfigUpdate.safeParse({
			password_min_length: '12',
			currency: 'ils',
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.password_min_length).toBe(12)
			expect(result.data.currency).toBe('ils')
		}
	})

	test('accepts an empty object (all keys are optional)', () => {
		const result = schemaConfigUpdate.safeParse({})
		expect(result.success).toBe(true)
	})

	test('rejects an unknown key (strict mode)', () => {
		const result = schemaConfigUpdate.safeParse({
			nonexistent_key: 'value',
		})
		expect(result.success).toBe(false)
	})

	test('rejects a non-numeric value for a number key', () => {
		const result = schemaConfigUpdate.safeParse({
			upload_image_max_size_mb: 'not-a-number',
		})
		expect(result.success).toBe(false)
	})

	test('rejects a zero or negative value for a number key', () => {
		const result = schemaConfigUpdate.safeParse({
			upload_image_max_size_mb: 0,
		})
		expect(result.success).toBe(false)
	})

	test('coerces numeric strings for number keys', () => {
		const result = schemaConfigUpdate.safeParse({
			community_membership_price_cents: '2500',
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(typeof result.data.community_membership_price_cents).toBe('number')
			expect(result.data.community_membership_price_cents).toBe(2500)
		}
	})

	test('accepts all known config keys', () => {
		const payload: Record<string, string> = {
			currency: 'usd',
			contact_message_max_length: '5000',
			pagination_default_page_size: '30',
		}
		const result = schemaConfigUpdate.safeParse(payload)
		expect(result.success).toBe(true)
	})
})
