import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { CourseStorage } from '@/services/courses-storage'
import { CourseCategoryStorage } from '@/services/course-categories-storage'
import { CourseClassStorage } from '@/services/course-classes-storage'
import { courseLevels, publishingStatuses } from '@/models/courses'

// ── listCourses ─────────────────────────────────────────────────────

export const listCourses = tool({
	description:
		'List all courses in the platform. Returns course summaries with uuid, title, slug, status, category, level, price, and instructor.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await CourseStorage.list()
		return {
			count: items.length,
			courses: items.map((c) => ({
				uuid: c.uuid,
				title: c.title,
				slug: c.slug,
				status: c.status,
				category: c.category,
				level: c.level,
				price: c.price,
				communityPrice: c.communityPrice,
				instructor: c.instructor,
			})),
		}
	},
})
registerTool('listCourses', { role: 'admin' })

// ── getCourse ───────────────────────────────────────────────────────

export const getCourse = tool({
	description:
		'Get full details of a single course by its UUID. Returns title, description, price, status, category, instructor, schedule, and all metadata fields.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the course to retrieve'),
	}),
	execute: async ({ uuid }) => {
		const course = await CourseStorage.get(uuid)
		if (!course) {
			return { error: 'Course not found' }
		}
		return {
			uuid: course.uuid,
			slug: course.slug,
			title: course.title,
			category: course.category,
			categoryUuid: course.categoryUuid,
			categorySlug: course.categorySlug,
			level: course.level,
			status: course.status,
			price: course.price,
			communityPrice: course.communityPrice,
			durationHours: course.durationHours,
			startDate: course.startDate,
			endDate: course.endDate,
			imageLabel: course.imageLabel,
			thumbnailImageUrl: course.thumbnailImageUrl,
			coverImageUrl: course.coverImageUrl,
			accent: course.accent,
			description: course.description,
			summary: course.summary,
			instructor: course.instructor,
			instructorUuid: course.instructorUuid,
			instructorSlug: course.instructorSlug,
			video: course.video,
			certificate: course.certificate,
			zoomLink: course.zoomLink,
			stripePaymentLink: course.stripePaymentLink,
			maxStudents: course.maxStudents,
			includes: course.includes,
			outcomes: course.outcomes,
		}
	},
})
registerTool('getCourse', { role: 'admin' })

// ── createCourse ────────────────────────────────────────────────────

export const createCourse = tool({
	description:
		'Create a new course. Title is required. Optional fields: description, category, categorySlug, level (Beginner/Intermediate/Advanced), price, communityPrice, instructor, instructorSlug, startDate, endDate, durationHours, status (draft/published/archived), maxStudents, includes (array of strings), outcomes (array of strings), thumbnailImageUrl, coverImageUrl, accent, video, certificate, zoomLink, stripePaymentLink, imageLabel.',
	inputSchema: z.object({
		title: z.string().min(2).max(200).describe('Course title'),
		description: z.string().optional().describe('Course description'),
		category: z.string().optional().describe('Category name'),
		categorySlug: z.string().optional().describe('Category URL slug'),
		level: z.enum(courseLevels).optional().describe('Difficulty level'),
		price: z.number().nonnegative().optional().describe('Price in USD'),
		communityPrice: z.number().nonnegative().optional().describe('Community price in USD'),
		instructor: z.string().optional().describe('Instructor name'),
		instructorSlug: z.string().optional().describe('Instructor URL slug'),
		startDate: z.string().optional().describe('Course start date'),
		endDate: z.string().optional().describe('Course end date'),
		durationHours: z.number().nonnegative().optional().describe('Duration in hours'),
		status: z.enum(publishingStatuses).optional().describe('Publishing status'),
		maxStudents: z.number().int().nonnegative().optional().describe('Maximum students'),
		includes: z.array(z.string()).optional().describe('List of included features'),
		outcomes: z.array(z.string()).optional().describe('Learning outcomes'),
		thumbnailImageUrl: z.string().optional().describe('Thumbnail image URL'),
		coverImageUrl: z.string().optional().describe('Cover image URL'),
		accent: z.string().optional().describe('Accent color hex'),
		video: z.string().optional().describe('Video format label'),
		certificate: z.string().optional().describe('Certificate label'),
		zoomLink: z.string().optional().describe('Zoom access label'),
		stripePaymentLink: z.string().optional().describe('Stripe payment link'),
		imageLabel: z.string().optional().describe('Image accessibility label'),
	}),
	execute: async (input) => {
		const course = await CourseStorage.create(input)
		return {
			uuid: course.uuid,
			slug: course.slug,
			title: course.title,
			status: course.status,
			message: 'Course created successfully',
		}
	},
})
registerTool('createCourse', { role: 'admin' })

// ── updateCourse ────────────────────────────────────────────────────

export const updateCourse = tool({
	description:
		'Update an existing course by UUID. Only the fields provided will be updated. All fields are optional except uuid.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the course to update'),
		title: z.string().min(2).max(200).optional().describe('Course title'),
		description: z.string().optional().describe('Course description'),
		category: z.string().optional().describe('Category name'),
		categorySlug: z.string().optional().describe('Category URL slug'),
		level: z.enum(courseLevels).optional().describe('Difficulty level'),
		price: z.number().nonnegative().optional().describe('Price in USD'),
		communityPrice: z.number().nonnegative().optional().describe('Community price in USD'),
		instructor: z.string().optional().describe('Instructor name'),
		instructorSlug: z.string().optional().describe('Instructor URL slug'),
		startDate: z.string().optional().describe('Course start date'),
		endDate: z.string().optional().describe('Course end date'),
		durationHours: z.number().nonnegative().optional().describe('Duration in hours'),
		status: z.enum(publishingStatuses).optional().describe('Publishing status'),
		maxStudents: z.number().int().nonnegative().optional().describe('Maximum students'),
		includes: z.array(z.string()).optional().describe('List of included features'),
		outcomes: z.array(z.string()).optional().describe('Learning outcomes'),
		thumbnailImageUrl: z.string().optional().describe('Thumbnail image URL'),
		coverImageUrl: z.string().optional().describe('Cover image URL'),
		accent: z.string().optional().describe('Accent color hex'),
		video: z.string().optional().describe('Video format label'),
		certificate: z.string().optional().describe('Certificate label'),
		zoomLink: z.string().optional().describe('Zoom access label'),
		stripePaymentLink: z.string().optional().describe('Stripe payment link'),
		imageLabel: z.string().optional().describe('Image accessibility label'),
	}),
	execute: async ({ uuid, ...updates }) => {
		const course = await CourseStorage.update(uuid, updates)
		if (!course) {
			return { error: 'Course not found' }
		}
		return {
			uuid: course.uuid,
			slug: course.slug,
			title: course.title,
			status: course.status,
			message: 'Course updated successfully',
		}
	},
})
registerTool('updateCourse', { role: 'admin' })

// ── deleteCourse ────────────────────────────────────────────────────

export const deleteCourse = tool({
	description:
		'Delete a course by UUID. This action cannot be undone. ⚠️ Requires operator approval before execution.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the course to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await CourseStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Course not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteCourse', { role: 'admin', needsApproval: true })

// ── listCourseCategories ────────────────────────────────────────────

export const listCourseCategories = tool({
	description:
		'List all course categories. Returns category summaries with uuid, name, slug, description, and enabled status.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await CourseCategoryStorage.list()
		return {
			count: items.length,
			categories: items.map((c) => ({
				uuid: c.uuid,
				name: c.name,
				slug: c.slug,
				description: c.description,
				enabled: c.enabled,
			})),
		}
	},
})
registerTool('listCourseCategories', { role: 'admin' })

// ── listCourseClasses ───────────────────────────────────────────────

export const listCourseClasses = tool({
	description:
		'List all classes for a specific course by course UUID. Returns class summaries with uuid, title, description, order, and imageUrl.',
	inputSchema: z.object({
		courseUuid: z
			.string()
			.uuid()
			.describe('The UUID of the course whose classes to list'),
	}),
	execute: async ({ courseUuid }) => {
		const items = await CourseClassStorage.listByCourse(courseUuid)
		return {
			count: items.length,
			classes: items.map((c) => ({
				uuid: c.uuid,
				courseUuid: c.courseUuid,
				title: c.title,
				description: c.description,
				order: c.order,
				imageUrl: c.imageUrl,
			})),
		}
	},
})
registerTool('listCourseClasses', { role: 'admin' })
