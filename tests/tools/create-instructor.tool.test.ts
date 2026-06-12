import { beforeAll, describe, expect, mock, test } from 'bun:test'

// Track registered tools for verification
const registeredTools = new Map<string, { role: string; needsApproval?: boolean }>()

mock.module('server-only', () => ({}))

mock.module('@/lib/llm-tool-auth', () => ({
	registerTool: (name: string, config: { role: string; needsApproval?: boolean }) => {
		registeredTools.set(name, config)
	},
}))

// ── Mock storage service ────────────────────────────────────────────

const mockInstructors: Array<Record<string, unknown>> = []

function resetStorage() {
	mockInstructors.length = 0
}

mock.module('@/services/instructors-storage', () => ({
	InstructorStorage: {
		create: (input: Record<string, unknown>) => {
			const displayName =
				(input.displayName as string)?.trim() ||
				`${input.firstName} ${input.lastName}`
			const slug = displayName
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
			const instructor = {
				uuid: 'inst-' + (mockInstructors.length + 1),
				slug,
				firstName: input.firstName,
				lastName: input.lastName,
				displayName,
				email: input.email || undefined,
				bio: input.bio || '',
				photoUrl: input.photoUrl || '',
				enabled: input.enabled !== undefined ? input.enabled : true,
			}
			mockInstructors.push(instructor)
			return Promise.resolve(instructor)
		},
	},
}))

// ── Import tool after mocks are set ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createInstructor: any

beforeAll(async () => {
	const mod = await import(
		'@/app/api/agentes/chat/tools/create-instructor.tool'
	)
	createInstructor = mod.createInstructor
})

// ── Tests ──────────────────────────────────────────────────────────

describe('create-instructor.tool', () => {
	describe('tool registration', () => {
		test('registers createInstructor with admin role', () => {
			expect(registeredTools.has('createInstructor')).toBe(true)
			expect(registeredTools.get('createInstructor')?.role).toBe('admin')
		})

		test('createInstructor does not require approval', () => {
			expect(
				registeredTools.get('createInstructor')?.needsApproval,
			).toBeFalsy()
		})
	})

	describe('createInstructor', () => {
		test('creates instructor with required fields only', async () => {
			resetStorage()
			const result = (await createInstructor.execute({
				firstName: 'Ernesto',
				lastName: 'Yattah',
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.firstName).toBe('Ernesto')
			expect(result.lastName).toBe('Yattah')
			expect(result.displayName).toBe('Ernesto Yattah')
			expect(result.slug).toBe('ernesto-yattah')
			expect(result.enabled).toBe(true)
			expect(result.bio).toBe('')
			expect(result.email).toBeUndefined()
			expect(result.message).toBe('Instructor created successfully')
		})

		test('creates instructor with all optional fields', async () => {
			resetStorage()
			const result = (await createInstructor.execute({
				firstName: 'Sarah',
				lastName: 'Cohen',
				displayName: 'Dr. Sarah Cohen',
				email: 'sarah@example.com',
				bio: 'Professor of Jewish Studies',
				photoUrl: '/uploads/instructors/sarah.jpg',
				enabled: false,
			})) as Record<string, unknown>

			expect(result.displayName).toBe('Dr. Sarah Cohen')
			expect(result.slug).toBe('dr-sarah-cohen')
			expect(result.email).toBe('sarah@example.com')
			expect(result.bio).toBe('Professor of Jewish Studies')
			expect(result.photoUrl).toBe('/uploads/instructors/sarah.jpg')
			expect(result.enabled).toBe(false)
		})

		test('auto-generates displayName from firstName + lastName', async () => {
			resetStorage()
			const result = (await createInstructor.execute({
				firstName: 'David',
				lastName: 'Levi',
			})) as Record<string, unknown>

			expect(result.displayName).toBe('David Levi')
			expect(result.slug).toBe('david-levi')
		})

		test('handles empty email string', async () => {
			resetStorage()
			const result = (await createInstructor.execute({
				firstName: 'Moshe',
				lastName: 'Dayan',
				email: '',
			})) as Record<string, unknown>

			expect(result.email).toBeUndefined()
		})
	})
})
