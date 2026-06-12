import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { CourseStorage } from '@/services/courses-storage'
import { courseLevels } from '@/models/courses'

// ── createNewCourse ──────────────────────────────────────────────────

export const createNewCourse = tool({
	description:
		'Create a new course with structured input. Title is required. Optional fields: categoryUuid (category UUID), instructorUuid (instructor UUID), level (Beginner/Intermediate/Advanced), price, communityPrice, durationHours, startDate, endDate, maxStudents, summary, description, includes (array of strings), outcomes (array of strings). Returns uuid and slug.',
	inputSchema: z.object({
		title: z.string().min(2).max(200).describe('Course title'),
		categoryUuid: z
			.string()
			.uuid()
			.optional()
			.describe('UUID of the course category'),
		instructorUuid: z
			.string()
			.uuid()
			.optional()
			.describe('UUID of the instructor'),
		level: z
			.enum(courseLevels)
			.optional()
			.describe('Difficulty level (Beginner/Intermediate/Advanced)'),
		price: z.number().nonnegative().optional().describe('Price in USD'),
		communityPrice: z
			.number()
			.nonnegative()
			.optional()
			.describe('Community price in USD'),
		durationHours: z
			.number()
			.nonnegative()
			.optional()
			.describe('Duration in hours'),
		startDate: z.string().optional().describe('Course start date'),
		endDate: z.string().optional().describe('Course end date'),
		maxStudents: z
			.number()
			.int()
			.nonnegative()
			.optional()
			.describe('Maximum number of students'),
		summary: z.string().optional().describe('Brief course summary'),
		description: z.string().optional().describe('Full course description'),
		includes: z
			.array(z.string())
			.optional()
			.describe('List of included features (e.g. ["Video lectures", "PDF notes"])'),
		outcomes: z
			.array(z.string())
			.optional()
			.describe('List of learning outcomes (e.g. ["Read Torah", "Understand basics"])'),
	}),
	execute: async (input) => {
		const course = await CourseStorage.create(input)
		return {
			uuid: course.uuid,
			slug: course.slug,
		}
	},
})
registerTool('createNewCourse', { role: 'admin' })
