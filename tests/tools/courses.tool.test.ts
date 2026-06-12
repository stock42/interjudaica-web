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
const mockCategories: Array<Record<string, unknown>> = []
const mockClasses: Array<Record<string, unknown>> = []

function resetStorage() {
	mockCourses.length = 0
	mockCategories.length = 0
	mockClasses.length = 0
}

mock.module('@/services/courses-storage', () => ({
	CourseStorage: {
		list: () => Promise.resolve([...mockCourses]),
		get: (uuid: string) => {
			const found = mockCourses.find((c) => c.uuid === uuid)
			return Promise.resolve(found ?? null)
		},
		create: (input: Record<string, unknown>) => {
			const course = {
				uuid: 'course-' + (mockCourses.length + 1),
				slug: (input.title as string || 'untitled').toLowerCase().replace(/\s+/g, '-'),
				title: input.title || 'Untitled Course',
				status: input.status || 'draft',
				...input,
			}
			mockCourses.push(course)
			return Promise.resolve(course)
		},
		update: (uuid: string, input: Record<string, unknown>) => {
			const idx = mockCourses.findIndex((c) => c.uuid === uuid)
			if (idx === -1) return Promise.resolve(null)
			mockCourses[idx] = { ...mockCourses[idx], ...input }
			return Promise.resolve(mockCourses[idx])
		},
		delete: (uuid: string) => {
			const idx = mockCourses.findIndex((c) => c.uuid === uuid)
			if (idx === -1) return Promise.resolve(0)
			mockCourses.splice(idx, 1)
			return Promise.resolve(1)
		},
	},
}))

mock.module('@/services/course-categories-storage', () => ({
	CourseCategoryStorage: {
		list: () => Promise.resolve([...mockCategories]),
	},
}))

mock.module('@/services/course-classes-storage', () => ({
	CourseClassStorage: {
		listByCourse: (courseUuid: string) =>
			Promise.resolve(mockClasses.filter((c) => c.courseUuid === courseUuid)),
	},
}))

// ── Import tools after mocks are set ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let listCourses: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getCourse: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createCourse: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let updateCourse: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deleteCourse: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let listCourseCategories: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let listCourseClasses: any

beforeAll(async () => {
	const mod = await import('@/app/api/agentes/chat/tools/courses.tool')
	listCourses = mod.listCourses
	getCourse = mod.getCourse
	createCourse = mod.createCourse
	updateCourse = mod.updateCourse
	deleteCourse = mod.deleteCourse
	listCourseCategories = mod.listCourseCategories
	listCourseClasses = mod.listCourseClasses
})

// ── Tests ──────────────────────────────────────────────────────────

describe('courses.tool', () => {
	describe('tool registration', () => {
		test('registers all 7 tools with admin role', () => {
			const expectedTools = [
				'listCourses',
				'getCourse',
				'createCourse',
				'updateCourse',
				'deleteCourse',
				'listCourseCategories',
				'listCourseClasses',
			]

			for (const name of expectedTools) {
				expect(registeredTools.has(name)).toBe(true)
				expect(registeredTools.get(name)?.role).toBe('admin')
			}
		})

		test('deleteCourse has needsApproval: true', () => {
			expect(registeredTools.get('deleteCourse')?.needsApproval).toBe(true)
		})

		test('non-destructive tools do not require approval', () => {
			const nonDestructive = ['listCourses', 'getCourse', 'createCourse', 'updateCourse']
			for (const name of nonDestructive) {
				expect(registeredTools.get(name)?.needsApproval).toBeFalsy()
			}
		})
	})

	describe('listCourses', () => {
		test('returns empty list when no courses exist', async () => {
			resetStorage()
			const result = (await listCourses.execute()) as {
				count: number
				courses: unknown[]
			}
			expect(result.count).toBe(0)
			expect(result.courses).toEqual([])
		})

		test('returns course summaries with expected fields', async () => {
			resetStorage()
			mockCourses.push(
				{
					uuid: 'c1',
					title: 'Introduction to Torah',
					slug: 'introduction-to-torah',
					status: 'published',
					category: 'Torah Studies',
					level: 'Beginner',
					price: 0,
					communityPrice: 0,
					instructor: 'Ernesto Yattah',
				},
				{
					uuid: 'c2',
					title: 'Advanced Talmud',
					slug: 'advanced-talmud',
					status: 'draft',
					category: 'Talmud',
					level: 'Advanced',
					price: 49,
					communityPrice: 29,
					instructor: 'Ernesto Cohen',
				},
			)

			const result = (await listCourses.execute()) as {
				count: number
				courses: Array<Record<string, unknown>>
			}
			expect(result.count).toBe(2)
			expect(result.courses[0]!.uuid).toBe('c1')
			expect(result.courses[0]!.title).toBe('Introduction to Torah')
			expect(result.courses[0]!.status).toBe('published')
			expect(result.courses[1]!.price).toBe(49)
		})
	})

	describe('getCourse', () => {
		test('returns full course details', async () => {
			resetStorage()
			mockCourses.push({
				uuid: 'c1',
				slug: 'torah-basics',
				title: 'Torah Basics',
				category: 'Torah',
				categoryUuid: 'cat-1',
				categorySlug: 'torah',
				level: 'Beginner',
				status: 'published',
				price: 29,
				communityPrice: 19,
				durationHours: 10,
				startDate: '2026-07-01',
				endDate: '2026-09-01',
				imageLabel: 'Torah',
				thumbnailImageUrl: '/img/thumb.jpg',
				coverImageUrl: '/img/cover.jpg',
				accent: '#164a9f',
				description: 'Learn the basics',
				summary: 'Basics of Torah',
				instructor: 'Ernesto Yattah',
				instructorUuid: 'inst-1',
				instructorSlug: 'ernesto-yattah',
				video: 'HD recordings',
				certificate: 'Certificate included',
				zoomLink: 'Live Zoom',
				stripePaymentLink: 'https://stripe.com/pay',
				maxStudents: 50,
				includes: ['Video', 'PDF'],
				outcomes: ['Read Torah', 'Understand basics'],
			})

			const result = (await getCourse.execute({ uuid: 'c1' })) as Record<string, unknown>
			expect(result.uuid).toBe('c1')
			expect(result.title).toBe('Torah Basics')
			expect(result.price).toBe(29)
			expect(result.includes).toEqual(['Video', 'PDF'])
			expect(result.outcomes).toEqual(['Read Torah', 'Understand basics'])
		})

		test('returns error for non-existent course', async () => {
			resetStorage()
			const result = (await getCourse.execute({ uuid: 'nonexistent' })) as Record<
				string,
				unknown
			>
			expect(result.error).toBe('Course not found')
		})
	})

	describe('createCourse', () => {
		test('creates a course with minimal input', async () => {
			resetStorage()
			const result = (await createCourse.execute({ title: 'New Course' })) as Record<
				string,
				unknown
			>
			expect(result.title).toBe('New Course')
			expect(result.uuid).toBeString()
			expect(result.slug).toBe('new-course')
			expect(result.status).toBe('draft')
			expect(result.message).toBe('Course created successfully')
		})

		test('creates a course with full input', async () => {
			resetStorage()
			const result = (await createCourse.execute({
				title: 'Full Course',
				description: 'A full course',
				price: 99,
				level: 'Advanced',
				status: 'published',
			})) as Record<string, unknown>
			expect(result.title).toBe('Full Course')
			expect(result.status).toBe('published')
		})
	})

	describe('updateCourse', () => {
		test('updates an existing course', async () => {
			resetStorage()
			mockCourses.push({ uuid: 'c1', title: 'Old Title', slug: 'old-title', status: 'draft' })

			const result = (await updateCourse.execute({
				uuid: 'c1',
				title: 'Updated Title',
			})) as Record<string, unknown>
			expect(result.title).toBe('Updated Title')
			expect(result.message).toBe('Course updated successfully')
		})

		test('returns error for non-existent course', async () => {
			resetStorage()
			const result = (await updateCourse.execute({
				uuid: 'nonexistent',
				title: 'Wont Work',
			})) as Record<string, unknown>
			expect(result.error).toBe('Course not found')
		})
	})

	describe('deleteCourse', () => {
		test('deletes an existing course', async () => {
			resetStorage()
			mockCourses.push({ uuid: 'c1', title: 'To Delete' })
			const result = (await deleteCourse.execute({ uuid: 'c1' })) as Record<string, unknown>
			expect(result.deleted).toBe(true)
			expect(result.uuid).toBe('c1')
		})

		test('returns error for non-existent course', async () => {
			resetStorage()
			const result = (await deleteCourse.execute({ uuid: 'nonexistent' })) as Record<
				string,
				unknown
			>
			expect(result.error).toBe('Course not found')
		})
	})

	describe('listCourseCategories', () => {
		test('returns empty list when no categories exist', async () => {
			resetStorage()
			const result = (await listCourseCategories.execute()) as {
				count: number
				categories: unknown[]
			}
			expect(result.count).toBe(0)
			expect(result.categories).toEqual([])
		})

		test('returns categories with expected fields', async () => {
			resetStorage()
			mockCategories.push(
				{ uuid: 'cat1', name: 'Torah', slug: 'torah', description: 'Torah studies', enabled: true },
				{ uuid: 'cat2', name: 'Talmud', slug: 'talmud', description: '', enabled: false },
			)

			const result = (await listCourseCategories.execute()) as {
				count: number
				categories: Array<Record<string, unknown>>
			}
			expect(result.count).toBe(2)
			expect(result.categories[0]!.name).toBe('Torah')
			expect(result.categories[1]!.enabled).toBe(false)
		})
	})

	describe('listCourseClasses', () => {
		test('returns empty list when no classes exist for course', async () => {
			resetStorage()
			const result = (await listCourseClasses.execute({
				courseUuid: 'c1',
			})) as { count: number; classes: unknown[] }
			expect(result.count).toBe(0)
			expect(result.classes).toEqual([])
		})

		test('returns only classes for the specified course', async () => {
			resetStorage()
			mockClasses.push(
				{ uuid: 'cl1', courseUuid: 'c1', title: 'Lesson 1', description: 'Intro', order: 1, imageUrl: '' },
				{ uuid: 'cl2', courseUuid: 'c1', title: 'Lesson 2', description: 'Advanced', order: 2, imageUrl: '/img/l2.jpg' },
				{ uuid: 'cl3', courseUuid: 'c2', title: 'Other Course', description: '', order: 1, imageUrl: '' },
			)

			const result = (await listCourseClasses.execute({
				courseUuid: 'c1',
			})) as { count: number; classes: Array<Record<string, unknown>> }
			expect(result.count).toBe(2)
			expect(result.classes[0]!.title).toBe('Lesson 1')
			expect(result.classes[1]!.title).toBe('Lesson 2')
			// Ensure the class from c2 is not included
			expect(result.classes.find((c) => c.courseUuid === 'c2')).toBeUndefined()
		})
	})
})
