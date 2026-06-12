import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { CourseCategoryStorage } from '@/services/course-categories-storage'

// ── createCourseCategory ─────────────────────────────────────────────

export const createCourseCategory = tool({
	description:
		'Create a new course category. Name is required. Optional: description. Returns the UUID of the created category.',
	inputSchema: z.object({
		name: z
			.string()
			.min(2)
			.max(100)
			.describe('Category name (e.g. "Torah Studies", "Talmud")'),
		description: z
			.string()
			.optional()
			.describe('Optional category description'),
	}),
	execute: async (input) => {
		const category = await CourseCategoryStorage.create(input)
		return {
			uuid: category.uuid,
		}
	},
})
registerTool('createCourseCategory', { role: 'admin' })
