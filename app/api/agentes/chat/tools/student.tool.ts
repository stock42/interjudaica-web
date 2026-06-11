import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { CourseStorage } from '@/services/courses-storage'
import { BookStorage } from '@/services/books-storage'
import { PaperStorage } from '@/services/papers-storage'
import { ForumStorage } from '@/services/forums-storage'
import { CourseEnrollmentStorage } from '@/services/course-enrollments-storage'
import { UserStorage } from '@/services/users-storage'
import { hasActiveCommunityMembership } from '@/services/community-memberships'

// ── discoverCourses ──────────────────────────────────────────────────

export const discoverCourses = tool({
	description:
		'Discover all published courses. Returns course summaries with uuid, title, slug, category, level, price, and instructor.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await CourseStorage.listPublished()
		return {
			count: items.length,
			courses: items.map((c) => ({
				uuid: c.uuid,
				title: c.title,
				slug: c.slug,
				category: c.category,
				level: c.level,
				price: c.price,
				communityPrice: c.communityPrice,
				instructor: c.instructor,
			})),
		}
	},
})
registerTool('discoverCourses', { role: 'student' })

// ── getCourseDetails ─────────────────────────────────────────────────

export const getCourseDetails = tool({
	description:
		'Get full details of a published course by its UUID. Returns title, description, price, category, instructor, schedule, and all metadata fields.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the course to retrieve'),
	}),
	execute: async ({ uuid }) => {
		const course = await CourseStorage.get(uuid)
		if (!course) {
			return { error: 'Course not found' }
		}
		if (course.status !== 'published') {
			return { error: 'Course is not available' }
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
			maxStudents: course.maxStudents,
			includes: course.includes,
			outcomes: course.outcomes,
		}
	},
})
registerTool('getCourseDetails', { role: 'student' })

// ── discoverPapers ───────────────────────────────────────────────────

export const discoverPapers = tool({
	description:
		'Discover public papers. Returns paper summaries with uuid, title, slug, summary, author, date, and category.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await PaperStorage.listPublishedByVisibility('public')
		return {
			count: items.length,
			papers: items.map((p) => ({
				uuid: p.uuid,
				title: p.title,
				slug: p.slug,
				summary: p.summary,
				author: p.author,
				date: p.date,
				category: p.category,
			})),
		}
	},
})
registerTool('discoverPapers', { role: 'student' })

// ── getPaperDetails ──────────────────────────────────────────────────

export const getPaperDetails = tool({
	description:
		'Get full details of a paper by UUID. Public papers are accessible to all students. Community papers require active community membership.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('Paper UUID'),
		userUuid: z
			.string()
			.uuid()
			.describe('Your student UUID for membership verification'),
	}),
	execute: async ({ uuid, userUuid }) => {
		const paper = await PaperStorage.get(uuid)
		if (!paper) {
			return { error: 'Paper not found' }
		}
		if (paper.status !== 'published') {
			return { error: 'Paper is not available' }
		}

		// Private papers are never accessible to students
		if (paper.visibility === 'private') {
			return { error: 'Paper is not available' }
		}

		// Community papers require active membership
		if (paper.visibility === 'community') {
			const user = await UserStorage.get(userUuid)
			if (!user) {
				return { error: 'User not found' }
			}
			const isMember = await hasActiveCommunityMembership(user)
			if (!isMember) {
				return {
					error: 'Community membership required to access this paper',
				}
			}
		}

		return paper
	},
})
registerTool('getPaperDetails', { role: 'student' })

// ── discoverBooks ────────────────────────────────────────────────────

export const discoverBooks = tool({
	description:
		'Discover all published books. Returns book summaries with uuid, title, slug, description, and price.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await BookStorage.listPublished()
		return {
			count: items.length,
			books: items.map((b) => ({
				uuid: b.uuid,
				title: b.title,
				slug: b.slug,
				description: b.description,
				coverUrl: b.coverUrl,
				price: b.price,
			})),
		}
	},
})
registerTool('discoverBooks', { role: 'student' })

// ── getBookDetails ───────────────────────────────────────────────────

export const getBookDetails = tool({
	description:
		'Get full details of a published book by UUID. Returns title, description, longDescription, coverUrl, and price.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('Book UUID'),
	}),
	execute: async ({ uuid }) => {
		const book = await BookStorage.get(uuid)
		if (!book) {
			return { error: 'Book not found' }
		}
		if (book.status !== 'published') {
			return { error: 'Book is not available' }
		}
		// Exclude internal file path
		return {
			uuid: book.uuid,
			slug: book.slug,
			title: book.title,
			description: book.description,
			longDescription: book.longDescription,
			coverUrl: book.coverUrl,
			price: book.price,
			status: book.status,
		}
	},
})
registerTool('getBookDetails', { role: 'student' })

// ── createForumPost ──────────────────────────────────────────────────

export const createForumPost = tool({
	description:
		'Create a new forum post. Requires title, area, and content. Optionally attach a course slug. The post will be attributed to your student account.',
	inputSchema: z.object({
		userUuid: z.string().uuid().describe('Your student UUID'),
		title: z.string().min(2).max(200).describe('Forum thread title'),
		area: z
			.string()
			.min(2)
			.max(100)
			.describe(
				'Forum area (e.g., "Community Forum", "Technical Support")',
			),
		content: z.string().min(1).describe('Thread content body'),
		courseSlug: z
			.string()
			.optional()
			.describe('Course slug if this is a course-specific discussion'),
	}),
	execute: async ({ userUuid, title, area, content, courseSlug }) => {
		const thread = await ForumStorage.create({
			title,
			area,
			content,
			courseSlug: courseSlug || '',
			createdBy: 'student',
			createdByUuid: userUuid,
			status: 'open',
		})
		return {
			uuid: thread.uuid,
			slug: thread.slug,
			title: thread.title,
			area: thread.area,
			message: 'Forum post created successfully',
		}
	},
})
registerTool('createForumPost', { role: 'student' })

// ── checkMyEnrollments ───────────────────────────────────────────────

export const checkMyEnrollments = tool({
	description:
		'Check your course enrollments. Returns the list of courses you are enrolled in.',
	inputSchema: z.object({
		userUuid: z.string().uuid().describe('Your student UUID'),
	}),
	execute: async ({ userUuid }) => {
		const enrollments = await CourseEnrollmentStorage.listByUser(userUuid)
		return {
			count: enrollments.length,
			enrollments: enrollments.map((e) => ({
				uuid: e.uuid,
				courseUuid: e.courseUuid,
				status: e.status,
				purchasedAt: e.purchasedAt,
			})),
		}
	},
})
registerTool('checkMyEnrollments', { role: 'student' })
