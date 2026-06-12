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

const mockTestimonials: Array<Record<string, unknown>> = []

function resetStorage() {
	mockTestimonials.length = 0
}

mock.module('@/services/social-proof-storage', () => ({
	SocialProofStorage: {
		create: (input: Record<string, unknown>) => {
			const testimonial = {
				uuid: 'testimonial-' + (mockTestimonials.length + 1),
				name: input.name || 'Anonymous',
				detail: input.detail || '',
				quote: input.quote || '',
				status: input.status || 'draft',
				order: input.order ?? 0,
			}
			mockTestimonials.push(testimonial)
			return Promise.resolve(testimonial)
		},
	},
}))

// ── Import tool after mocks are set ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createTestimonial: any

beforeAll(async () => {
	const mod = await import(
		'@/app/api/agentes/chat/tools/create-social-proof.tool'
	)
	createTestimonial = mod.createTestimonial
})

// ── Tests ──────────────────────────────────────────────────────────

describe('create-social-proof.tool', () => {
	describe('tool registration', () => {
		test('registers createTestimonial with admin role', () => {
			expect(registeredTools.has('createTestimonial')).toBe(true)
			expect(registeredTools.get('createTestimonial')?.role).toBe('admin')
		})

		test('createTestimonial does not require approval', () => {
			expect(registeredTools.get('createTestimonial')?.needsApproval).toBeFalsy()
		})
	})

	describe('createTestimonial', () => {
		test('creates a testimonial with required fields', async () => {
			resetStorage()
			const result = (await createTestimonial.execute({
				quote: 'This course changed my life!',
				name: 'Sarah Cohen',
				detail: 'Student, Torah Studies',
			})) as Record<string, unknown>
			expect(result.quote).toBe('This course changed my life!')
			expect(result.name).toBe('Sarah Cohen')
			expect(result.detail).toBe('Student, Torah Studies')
			expect(result.status).toBe('draft')
			expect(result.order).toBe(0)
			expect(result.message).toBe('Testimonial created successfully')
		})

		test('creates a testimonial with explicit order', async () => {
			resetStorage()
			const result = (await createTestimonial.execute({
				quote: 'Excellent teaching.',
				name: 'David Levy',
				detail: 'Community member',
				order: 3,
			})) as Record<string, unknown>
			expect(result.order).toBe(3)
		})

		test('creates a testimonial with published status', async () => {
			resetStorage()
			const result = (await createTestimonial.execute({
				quote: 'Highly recommend.',
				name: 'Miriam Katz',
				detail: 'Graduate, Advanced Talmud',
				status: 'published',
			})) as Record<string, unknown>
			expect(result.status).toBe('published')
		})

		test('stores testimonials independently', async () => {
			resetStorage()
			const r1 = (await createTestimonial.execute({
				quote: 'First quote.',
				name: 'Alice',
				detail: 'Role A',
			})) as Record<string, unknown>
			const r2 = (await createTestimonial.execute({
				quote: 'Second quote.',
				name: 'Bob',
				detail: 'Role B',
			})) as Record<string, unknown>
			expect(r1.uuid).toBe('testimonial-1')
			expect(r2.uuid).toBe('testimonial-2')
		})
	})
})
