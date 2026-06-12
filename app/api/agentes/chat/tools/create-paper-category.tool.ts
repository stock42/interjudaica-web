import 'server-only'

import { tool } from 'ai'
import { registerTool } from '@/lib/llm-tool-auth'
import { schemaPaperCategory } from '@/models/paper-categories'
import { PaperCategoryStorage } from '@/services/paper-categories-storage'

// ── createPaperCategory ─────────────────────────────────────────────

export const createPaperCategory = tool({
	description:
		'Create a new paper category. Name is required. Optional fields: description, enabled (defaults to true). Slug is auto-generated from name.',
	inputSchema: schemaPaperCategory.omit({ uuid: true, slug: true }),
	execute: async (input) => {
		const category = await PaperCategoryStorage.create(input)
		return category
	},
})
registerTool('createPaperCategory', { role: 'admin' })
