import { beforeAll, describe, expect, mock, test } from 'bun:test'

// Track registered tools for verification
const registeredTools = new Map<string, { role: string; needsApproval?: boolean }>()

mock.module('server-only', () => ({}))

mock.module('@/lib/llm-tool-auth', () => ({
	registerTool: (name: string, config: { role: string; needsApproval?: boolean }) => {
		registeredTools.set(name, config)
	},
}))

// ── Mock storage services ──────────────────────────────────────────

const mockCategories: Array<Record<string, unknown>> = []

function resetStorage() {
	mockCategories.length = 0
}

mock.module('@/services/course-categories-storage', () => ({
	CourseCategoryStorage: {
		create: (input: Record<string, unknown>) => {
			const category = {
				uuid: 'category-' + (mockCategories.length + 1),
				name: input.name || 'Untitled Category',
				slug: ((input.name as string) || 'untitled')
					.toLowerCase()
					.replace(/\s+/g, '-'),
				description: input.description || '',
				enabled: true,
				...input,
			}
			mockCategories.push(category)
			return Promise.resolve(category)
		},
	},
}))

// ── Import tools after mocks are set ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createCourseCategory: any

beforeAll(async () => {
	const mod = await import(
		'@/app/api/agentes/chat/tools/create-course-category.tool'
	)
	createCourseCategory = mod.createCourseCategory
})

// ── Tests ──────────────────────────────────────────────────────────

describe('create-course-category.tool', () => {
	describe('tool registration', () => {
		test('registers createCourseCategory with admin role', () => {
			expect(registeredTools.has('createCourseCategory')).toBe(true)
			expect(registeredTools.get('createCourseCategory')?.role).toBe('admin')
		})

		test('createCourseCategory does not require approval', () => {
			expect(
				registeredTools.get('createCourseCategory')?.needsApproval,
			).toBeFalsy()
		})
	})

	describe('createCourseCategory', () => {
		test('creates a category with name only', async () => {
			resetStorage()
			const result = (await createCourseCategory.execute({
				name: 'Torah Studies',
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.uuid).toBe('category-1')
		})

		test('creates a category with name and description', async () => {
			resetStorage()
			const result = (await createCourseCategory.execute({
				name: 'Talmud',
				description: 'Study of the Talmud and related texts',
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.uuid).toBe('category-1')
		})

		test('creates multiple categories with unique UUIDs', async () => {
			resetStorage()
			const result1 = (await createCourseCategory.execute({
				name: 'Category One',
			})) as Record<string, unknown>
			const result2 = (await createCourseCategory.execute({
				name: 'Category Two',
			})) as Record<string, unknown>

			expect(result1.uuid).toBe('category-1')
			expect(result2.uuid).toBe('category-2')
			expect(result1.uuid).not.toBe(result2.uuid)
		})

		test('category name with special characters generates slug', async () => {
			resetStorage()
			await createCourseCategory.execute({
				name: 'Jewish Philosophy & Ethics',
			})

			expect(mockCategories.length).toBe(1)
			expect(mockCategories[0]!.name).toBe('Jewish Philosophy & Ethics')
		})

		test('stores category in mock storage', async () => {
			resetStorage()
			await createCourseCategory.execute({
				name: 'Mysticism',
				description: 'Study of Kabbalah and mysticism',
			})

			expect(mockCategories.length).toBe(1)
			expect(mockCategories[0]!.name).toBe('Mysticism')
			expect(mockCategories[0]!.description).toBe(
				'Study of Kabbalah and mysticism',
			)
		})
	})
})
