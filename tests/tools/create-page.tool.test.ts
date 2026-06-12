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

const mockPages: Array<Record<string, unknown>> = []

function resetStorage() {
	mockPages.length = 0
}

mock.module('@/services/pages-storage', () => ({
	PageStorage: {
		create: (input: Record<string, unknown>) => {
			const page = {
				uuid: 'page-' + (mockPages.length + 1),
				slug: ((input.title as string) || 'untitled')
					.toLowerCase()
					.replace(/\s+/g, '-'),
				title: input.title || 'Untitled Page',
				status: input.status || 'draft',
				description: input.description || '',
				content: input.content || '',
			}
			mockPages.push(page)
			return Promise.resolve(page)
		},
	},
}))

// ── Import tool after mocks are set ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createPage: any

beforeAll(async () => {
	const mod = await import('@/app/api/agentes/chat/tools/create-page.tool')
	createPage = mod.createPage
})

// ── Tests ──────────────────────────────────────────────────────────

describe('create-page.tool', () => {
	describe('tool registration', () => {
		test('registers createPage with admin role', () => {
			expect(registeredTools.has('createPage')).toBe(true)
			expect(registeredTools.get('createPage')?.role).toBe('admin')
		})

		test('createPage does not require approval', () => {
			expect(registeredTools.get('createPage')?.needsApproval).toBeFalsy()
		})
	})

	describe('createPage', () => {
		test('creates a page with minimal input (title only)', async () => {
			resetStorage()
			const result = (await createPage.execute({
				title: 'About Us',
			})) as Record<string, unknown>
			expect(result.title).toBe('About Us')
			expect(result.uuid).toBeString()
			expect(result.slug).toBe('about-us')
			expect(result.status).toBe('draft')
			expect(result.message).toBe('Page created successfully')
		})

		test('creates a page with description and markdown content', async () => {
			resetStorage()
			const result = (await createPage.execute({
				title: 'Privacy Policy',
				description: 'Our privacy policy page',
				content: '# Privacy\n\nWe value your privacy.',
			})) as Record<string, unknown>
			expect(result.title).toBe('Privacy Policy')
			expect(result.slug).toBe('privacy-policy')
			expect(result.status).toBe('draft')
		})

		test('creates a page with published status', async () => {
			resetStorage()
			const result = (await createPage.execute({
				title: 'Terms of Service',
				content: 'Terms content here.',
				status: 'published',
			})) as Record<string, unknown>
			expect(result.title).toBe('Terms of Service')
			expect(result.status).toBe('published')
		})

		test('stores pages independently (increments mock uuid)', async () => {
			resetStorage()
			const r1 = (await createPage.execute({
				title: 'Page One',
			})) as Record<string, unknown>
			const r2 = (await createPage.execute({
				title: 'Page Two',
			})) as Record<string, unknown>
			expect(r1.uuid).toBe('page-1')
			expect(r2.uuid).toBe('page-2')
		})
	})
})
