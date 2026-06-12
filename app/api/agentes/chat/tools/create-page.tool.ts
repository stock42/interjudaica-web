import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { PageStorage } from '@/services/pages-storage'

// ── createPage ───────────────────────────────────────────────────────

export const createPage = tool({
	description:
		'Create a new CMS page. Title is required. Slug is auto-generated from title. Optional fields: description (max 500 chars), content (markdown, max 100K chars), status (draft/published/archived, defaults to draft).',
	inputSchema: z.object({
		title: z.string().min(2).max(200).describe('Page title'),
		description: z
			.string()
			.max(500)
			.optional()
			.describe('Brief page description'),
		content: z
			.string()
			.max(100000)
			.optional()
			.describe('Page content in markdown'),
		status: z
			.enum(['draft', 'published', 'archived'])
			.optional()
			.describe('Publishing status'),
	}),
	execute: async (input) => {
		const page = await PageStorage.create(input)
		return {
			uuid: page.uuid,
			slug: page.slug,
			title: page.title,
			status: page.status,
			message: 'Page created successfully',
		}
	},
})
registerTool('createPage', { role: 'admin' })
