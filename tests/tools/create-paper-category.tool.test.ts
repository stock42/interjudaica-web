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

mock.module('@/services/paper-categories-storage', () => ({
	PaperCategoryStorage: {
		create: (input: Record<string, unknown>) => {
			const category = {
				uuid: 'cat-' + (mockCategories.length + 1),
				slug: (input.name as string || 'untitled').toLowerCase().replace(/\s+/g, '-'),
				name: input.name || 'Untitled Category',
				description: input.description || '',
				enabled: input.enabled !== undefined ? input.enabled : true,
				...input,
			}
			mockCategories.push(category)
			return Promise.resolve(category)
		},
	},
}))

// ── Import tool after mocks are set ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createPaperCategory: any

beforeAll(async () => {
	const mod = await import(
		'@/app/api/agentes/chat/tools/create-paper-category.tool'
	)
	createPaperCategory = mod.createPaperCategory
})

// ── Tests ──────────────────────────────────────────────────────────

describe('create-paper-category.tool', () => {
	describe('tool registration', () => {
		test('registers createPaperCategory with admin role', () => {
			expect(registeredTools.has('createPaperCategory')).toBe(true)
			expect(registeredTools.get('createPaperCategory')?.role).toBe('admin')
		})

		test('createPaperCategory does not require approval', () => {
			expect(registeredTools.get('createPaperCategory')?.needsApproval).toBeFalsy()
		})
	})

	describe('createPaperCategory', () => {
		test('creates a category with name only', async () => {
			resetStorage()
			const result = (await createPaperCategory.execute({
				name: 'Theology',
			})) as Record<string, unknown>
			expect(result.name).toBe('Theology')
			expect(result.uuid).toBeString()
			expect(result.slug).toBe('theology')
			expect(result.enabled).toBe(true)
			expect(result.description).toBe('')
		})

		test('creates a category with all fields', async () => {
			resetStorage()
			const result = (await createPaperCategory.execute({
				name: 'Philosophy Papers',
				description: 'Papers about Jewish philosophy',
				enabled: false,
			})) as Record<string, unknown>
			expect(result.name).toBe('Philosophy Papers')
			expect(result.description).toBe('Papers about Jewish philosophy')
			expect(result.enabled).toBe(false)
		})

		test('auto-generates slug from name', async () => {
			resetStorage()
			const result = (await createPaperCategory.execute({
				name: 'Advanced Studies',
			})) as Record<string, unknown>
			expect(result.slug).toBe('advanced-studies')
		})

		test('persists category to mock storage', async () => {
			resetStorage()
			await createPaperCategory.execute({ name: 'History' })
			expect(mockCategories.length).toBe(1)
			expect(mockCategories[0]!.name).toBe('History')
		})
	})
})
