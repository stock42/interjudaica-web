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

let storedBio: Record<string, unknown> | null = null

mock.module('@/services/owner-bio-storage', () => ({
	OwnerBioStorage: {
		upsertBySlug: (slug: string, input: Record<string, unknown>) => {
			const bio = {
				uuid: storedBio?.uuid || 'bio-uuid-1',
				slug,
				title: input.title || storedBio?.title || 'Ernesto Yattah',
				markdown: input.markdown ?? storedBio?.markdown ?? '',
				updatedAt: new Date().toISOString(),
			}
			storedBio = bio
			return Promise.resolve(bio)
		},
	},
}))

// ── Import tool after mocks are set ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let updateOwnerBio: any

beforeAll(async () => {
	const mod = await import(
		'@/app/api/agentes/chat/tools/update-owner-bio.tool'
	)
	updateOwnerBio = mod.updateOwnerBio
})

// ── Tests ──────────────────────────────────────────────────────────

describe('update-owner-bio.tool', () => {
	describe('tool registration', () => {
		test('registers updateOwnerBio with admin role', () => {
			expect(registeredTools.has('updateOwnerBio')).toBe(true)
			expect(registeredTools.get('updateOwnerBio')?.role).toBe('admin')
		})

		test('updateOwnerBio does not require approval', () => {
			expect(registeredTools.get('updateOwnerBio')?.needsApproval).toBeFalsy()
		})
	})

	describe('updateOwnerBio', () => {
		test('upserts with title only', async () => {
			storedBio = null
			const result = (await updateOwnerBio.execute({
				title: 'Ernesto Yattah PhD',
			})) as Record<string, unknown>
			expect(result.title).toBe('Ernesto Yattah PhD')
			expect(result.slug).toBe('ernesto-yattah')
			expect(result.message).toBe('Owner bio updated successfully')
		})

		test('upserts with markdown only', async () => {
			storedBio = null
			const result = (await updateOwnerBio.execute({
				markdown: '# Biography\n\nErnesto has been teaching for 20 years.',
			})) as Record<string, unknown>
			expect(result.title).toBe('Ernesto Yattah')
			expect(result.slug).toBe('ernesto-yattah')
		})

		test('upserts with both title and markdown', async () => {
			storedBio = null
			const result = (await updateOwnerBio.execute({
				title: 'Dr. Ernesto Yattah',
				markdown: 'Updated bio content.',
			})) as Record<string, unknown>
			expect(result.title).toBe('Dr. Ernesto Yattah')
		})

		test('upsert preserves existing data when partial update', async () => {
			storedBio = {
				uuid: 'existing-uuid',
				slug: 'ernesto-yattah',
				title: 'Original Title',
				markdown: 'Original content.',
				updatedAt: '2026-01-01T00:00:00.000Z',
			}
			const result = (await updateOwnerBio.execute({
				markdown: 'Updated content only.',
			})) as Record<string, unknown>
			expect(result.title).toBe('Original Title')
			expect(result.uuid).toBe('existing-uuid')
		})

		test('uses the ernesto-yattah slug regardless of input', async () => {
			storedBio = null
			const result = (await updateOwnerBio.execute({
				title: 'Some Title',
			})) as Record<string, unknown>
			expect(result.slug).toBe('ernesto-yattah')
		})
	})
})
