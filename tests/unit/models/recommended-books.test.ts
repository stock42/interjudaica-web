import { describe, expect, test } from 'bun:test'
import {
	RecommendedBookModel,
	schemaRecommendedBook,
} from '@/models/recommended-books'

describe('schemaRecommendedBook', () => {
	test('parses minimal valid input with defaults', () => {
		const parsed = schemaRecommendedBook.parse({
			name: 'The Guide',
			author: 'Maimonides',
		})
		expect(parsed.name).toBe('The Guide')
		expect(parsed.author).toBe('Maimonides')
		expect(parsed.coverImageUrl).toBe('')
		expect(parsed.amazonLink).toBe('')
		expect(parsed.description).toBe('')
		expect(parsed.order).toBe(0)
		expect(parsed.status).toBe('draft')
	})

	test('parses full valid input', () => {
		const parsed = schemaRecommendedBook.parse({
			name: 'The Guide',
			author: 'Maimonides',
			coverImageUrl: 'https://example.com/cover.jpg',
			amazonLink: 'https://amazon.com/dp/123',
			description: 'A classic work',
			order: 1,
			status: 'published',
		})
		expect(parsed.name).toBe('The Guide')
		expect(parsed.author).toBe('Maimonides')
		expect(parsed.coverImageUrl).toBe('https://example.com/cover.jpg')
		expect(parsed.amazonLink).toBe('https://amazon.com/dp/123')
		expect(parsed.description).toBe('A classic work')
		expect(parsed.order).toBe(1)
		expect(parsed.status).toBe('published')
	})

	test('coerces order to number', () => {
		const parsed = schemaRecommendedBook.parse({
			name: 'Test Book',
			author: 'Author',
			order: '5',
		})
		expect(parsed.order).toBe(5)
	})

	test('rejects missing name', () => {
		expect(() =>
			schemaRecommendedBook.parse({ author: 'Author' }),
		).toThrow()
	})

	test('rejects missing author', () => {
		expect(() =>
			schemaRecommendedBook.parse({ name: 'Book' }),
		).toThrow()
	})

	test('rejects invalid status', () => {
		expect(() =>
			schemaRecommendedBook.parse({
				name: 'Book',
				author: 'Author',
				status: 'deleted',
			}),
		).toThrow()
	})

	test('rejects name too short', () => {
		expect(() =>
			schemaRecommendedBook.parse({ name: 'A', author: 'Author' }),
		).toThrow()
	})

	test('accepts all valid statuses', () => {
		expect(() =>
			schemaRecommendedBook.parse({
				name: 'Book',
				author: 'Author',
				status: 'draft',
			}),
		).not.toThrow()
		expect(() =>
			schemaRecommendedBook.parse({
				name: 'Book',
				author: 'Author',
				status: 'published',
			}),
		).not.toThrow()
		expect(() =>
			schemaRecommendedBook.parse({
				name: 'Book',
				author: 'Author',
				status: 'archived',
			}),
		).not.toThrow()
	})
})

describe('RecommendedBookModel', () => {
	test('creates valid data with defaults', () => {
		const model = new RecommendedBookModel({
			name: 'The Guide',
			author: 'Maimonides',
		})
		const data = model.getData()

		expect(data.name).toBe('The Guide')
		expect(data.author).toBe('Maimonides')
		expect(data.coverImageUrl).toBe('')
		expect(data.amazonLink).toBe('')
		expect(data.description).toBe('')
		expect(data.order).toBe(0)
		expect(data.status).toBe('draft')
		expect(data.uuid).toBeString()
		expect(data.uuid!.length).toBeGreaterThan(0)
	})

	test('generates a UUID', () => {
		const model1 = new RecommendedBookModel({
			name: 'Book A',
			author: 'Author',
		})
		const model2 = new RecommendedBookModel({
			name: 'Book B',
			author: 'Author',
		})
		expect(model1.getUUID()).not.toBe(model2.getUUID())
	})

	test('preserves provided UUID', () => {
		const model = new RecommendedBookModel({
			uuid: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Book',
			author: 'Author',
		})
		expect(model.getUUID()).toBe('550e8400-e29b-41d4-a716-446655440000')
	})

	test('getData returns a copy of the schema-validated data', () => {
		const model = new RecommendedBookModel({
			name: 'Book',
			author: 'Author',
			coverImageUrl: 'https://img.com/cover.jpg',
			amazonLink: 'https://amazon.com/book',
			description: 'Great book',
			order: 3,
			status: 'published',
		})
		const data = model.getData()
		expect(data.name).toBe('Book')
		expect(data.author).toBe('Author')
		expect(data.coverImageUrl).toBe('https://img.com/cover.jpg')
		expect(data.amazonLink).toBe('https://amazon.com/book')
		expect(data.description).toBe('Great book')
		expect(data.order).toBe(3)
		expect(data.status).toBe('published')
	})
})
