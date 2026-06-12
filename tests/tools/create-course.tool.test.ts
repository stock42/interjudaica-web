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

const mockCourses: Array<Record<string, unknown>> = []

function resetStorage() {
	mockCourses.length = 0
}

mock.module('@/services/courses-storage', () => ({
	CourseStorage: {
		create: (input: Record<string, unknown>) => {
			const course = {
				uuid: 'course-' + (mockCourses.length + 1),
				slug: ((input.title as string) || 'untitled')
					.toLowerCase()
					.replace(/\s+/g, '-'),
				title: input.title || 'Untitled Course',
				status: 'draft',
				...input,
			}
			mockCourses.push(course)
			return Promise.resolve(course)
		},
	},
}))

// ── Import tools after mocks are set ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createNewCourse: any

beforeAll(async () => {
	const mod = await import(
		'@/app/api/agentes/chat/tools/create-course.tool'
	)
	createNewCourse = mod.createNewCourse
})

// ── Tests ──────────────────────────────────────────────────────────

describe('create-course.tool', () => {
	describe('tool registration', () => {
		test('registers createNewCourse with admin role', () => {
			expect(registeredTools.has('createNewCourse')).toBe(true)
			expect(registeredTools.get('createNewCourse')?.role).toBe('admin')
		})

		test('createNewCourse does not require approval', () => {
			expect(registeredTools.get('createNewCourse')?.needsApproval).toBeFalsy()
		})
	})

	describe('createNewCourse', () => {
		test('creates a course with title only (all defaults)', async () => {
			resetStorage()
			const result = (await createNewCourse.execute({
				title: 'Introduction to Torah',
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.slug).toBe('introduction-to-torah')
		})

		test('creates a course with all fields', async () => {
			resetStorage()
			const result = (await createNewCourse.execute({
				title: 'Advanced Talmud',
				categoryUuid: '550e8400-e29b-41d4-a716-446655440001',
				instructorUuid: '550e8400-e29b-41d4-a716-446655440002',
				level: 'Advanced',
				price: 99,
				communityPrice: 49,
				durationHours: 20,
				startDate: '2026-07-01',
				endDate: '2026-09-01',
				maxStudents: 30,
				summary: 'Deep dive into Talmudic study',
				description:
					'A comprehensive course covering advanced Talmudic concepts and methodology.',
				includes: ['Video lectures', 'PDF notes', 'Live Q&A'],
				outcomes: ['Analyze Talmudic passages', 'Apply hermeneutic principles'],
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.slug).toBe('advanced-talmud')
		})

		test('creates a course with price and level', async () => {
			resetStorage()
			const result = (await createNewCourse.execute({
				title: 'Hebrew Basics',
				level: 'Beginner',
				price: 49,
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.slug).toBe('hebrew-basics')
		})

		test('creates a course with UUID references', async () => {
			resetStorage()
			const result = (await createNewCourse.execute({
				title: 'Kabbalah Studies',
				categoryUuid: '550e8400-e29b-41d4-a716-446655440003',
				instructorUuid: '550e8400-e29b-41d4-a716-446655440004',
			})) as Record<string, unknown>

			expect(result.uuid).toBeString()
			expect(result.slug).toBe('kabbalah-studies')
		})

		test('slug is generated from title with spaces', async () => {
			resetStorage()
			const result = (await createNewCourse.execute({
				title: 'Jewish History 101',
			})) as Record<string, unknown>

			expect(result.slug).toBe('jewish-history-101')
		})
	})
})
