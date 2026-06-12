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

const mockPapers: Array<Record<string, unknown>> = []
const mockForumThreads: Array<Record<string, unknown>> = []

function resetStorage() {
	mockPapers.length = 0
	mockForumThreads.length = 0
}

mock.module('@/services/papers-storage', () => ({
	PaperStorage: {
		create: (input: Record<string, unknown>) => {
			const paper = {
				uuid: 'paper-' + (mockPapers.length + 1),
				slug: (input.title as string || 'untitled').toLowerCase().replace(/\s+/g, '-'),
				title: input.title || 'Untitled Paper',
				author: input.author || 'Ernesto Yattah',
				visibility: input.visibility || 'community',
				status: input.status || 'draft',
				summary: input.summary || '',
				content: input.content || '',
				...input,
			}
			mockPapers.push(paper)
			return Promise.resolve(paper)
		},
	},
}))

mock.module('@/services/forums-storage', () => ({
	ForumStorage: {
		getByPaperUuid: (paperUuid: string) => {
			const found = mockForumThreads.find((t) => t.paperUuid === paperUuid)
			return Promise.resolve(found ?? null)
		},
		create: (input: Record<string, unknown>) => {
			const thread = {
				uuid: 'thread-' + (mockForumThreads.length + 1),
				...input,
			}
			mockForumThreads.push(thread)
			return Promise.resolve(thread)
		},
	},
}))

// ── Import tool after mocks are set ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createPaper: any

beforeAll(async () => {
	const mod = await import('@/app/api/agentes/chat/tools/create-paper.tool')
	createPaper = mod.createPaper
})

// ── Tests ──────────────────────────────────────────────────────────

describe('create-paper.tool', () => {
	describe('tool registration', () => {
		test('registers createPaper with admin role', () => {
			expect(registeredTools.has('createPaper')).toBe(true)
			expect(registeredTools.get('createPaper')?.role).toBe('admin')
		})

		test('createPaper does not require approval', () => {
			expect(registeredTools.get('createPaper')?.needsApproval).toBeFalsy()
		})
	})

	describe('createPaper', () => {
		test('creates a paper with minimal input (title only)', async () => {
			resetStorage()
			const result = (await createPaper.execute({ title: 'My Paper' })) as Record<
				string,
				unknown
			>
			expect(result.title).toBe('My Paper')
			expect(result.uuid).toBeString()
			expect(result.author).toBe('Ernesto Yattah')
			expect(result.visibility).toBe('community')
			expect(result.status).toBe('draft')
		})

		test('creates a paper with all fields', async () => {
			resetStorage()
			const result = (await createPaper.execute({
				title: 'Full Paper',
				author: 'Rabbi Cohen',
				visibility: 'public',
				status: 'published',
				summary: 'A complete paper summary',
				content: '# Full Paper\n\nThis is the content.',
				categoryUuid: 'cat-uuid-1',
				category: 'Theology',
			})) as Record<string, unknown>
			expect(result.title).toBe('Full Paper')
			expect(result.author).toBe('Rabbi Cohen')
			expect(result.visibility).toBe('public')
			expect(result.status).toBe('published')
			expect(result.summary).toBe('A complete paper summary')
			expect(result.content).toBe('# Full Paper\n\nThis is the content.')
		})

		test('auto-creates a forum thread for the new paper', async () => {
			resetStorage()
			const result = (await createPaper.execute({
				title: 'Paper with Thread',
				summary: 'Summary for forum',
			})) as Record<string, unknown>
			expect(mockForumThreads.length).toBe(1)
			expect(mockForumThreads[0]!.title).toBe('Paper with Thread')
			expect(mockForumThreads[0]!.area).toBe('Community Papers')
			expect(mockForumThreads[0]!.paperUuid).toBe(result.uuid)
			expect(mockForumThreads[0]!.content).toBe('Summary for forum')
			expect(mockForumThreads[0]!.status).toBe('open')
		})

		test('does not create duplicate forum thread when one exists', async () => {
			resetStorage()
			mockForumThreads.push({
				uuid: 'existing-thread',
				title: 'Existing',
				paperUuid: 'paper-1',
			})

			await createPaper.execute({
				title: 'Another Paper',
			})
			expect(mockForumThreads.length).toBe(1)
		})

		test('uses paper summary for forum content when available', async () => {
			resetStorage()
			await createPaper.execute({
				title: 'With Summary',
				summary: 'This is the paper summary',
			})
			expect(mockForumThreads[0]!.content).toBe('This is the paper summary')
		})

		test('uses fallback content when summary is empty', async () => {
			resetStorage()
			await createPaper.execute({
				title: 'No Summary',
				summary: '',
			})
			expect(mockForumThreads[0]!.content).toBe('New paper published')
		})
	})
})
