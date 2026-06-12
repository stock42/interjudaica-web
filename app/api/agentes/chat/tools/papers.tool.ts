import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'
import { registerTool } from '@/lib/llm-tool-auth'
import { schemaPaper } from '@/models/papers'
import { PaperStorage } from '@/services/papers-storage'
import { PaperCategoryStorage } from '@/services/paper-categories-storage'

// ── Paper Tools ──

export const listPapers = tool({
	description: 'List all papers (includes drafts, published, all visibilities)',
	inputSchema: z.object({}),
	execute: async () => {
		const papers = await PaperStorage.list()
		return { count: papers.length, papers }
	},
})
registerTool('listPapers', { role: 'admin' })

export const getPaper = tool({
	description: 'Get a single paper by UUID. Returns full paper data including content.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('Paper UUID'),
	}),
	execute: async ({ uuid }) => {
		const paper = await PaperStorage.get(uuid)
		if (!paper) throw new Error(`Paper not found: ${uuid}`)
		return paper
	},
})
registerTool('getPaper', { role: 'admin' })

export const updatePaper = tool({
	description: 'Update an existing paper by UUID. Only fields provided will be changed.',
	inputSchema: schemaPaper
		.partial()
		.extend({ uuid: z.string().uuid().describe('Paper UUID to update') }),
	execute: async ({ uuid, ...data }) => {
		const updated = await PaperStorage.update(uuid, data)
		if (!updated) throw new Error(`Paper not found: ${uuid}`)
		return updated
	},
})
registerTool('updatePaper', { role: 'admin' })

export const deletePaper = tool({
	description:
		'Delete a paper by UUID. WARNING: This is a destructive action that requires approval.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('Paper UUID to delete'),
	}),
	execute: async ({ uuid }) => {
		const deleted = await PaperStorage.delete(uuid)
		if (!deleted) throw new Error(`Paper not found or already deleted: ${uuid}`)
		return { deleted: true, uuid }
	},
})
registerTool('deletePaper', { role: 'admin', needsApproval: true })

// ── Paper Category Tools ──

export const listPaperCategories = tool({
	description: 'List all paper categories',
	inputSchema: z.object({}),
	execute: async () => {
		const categories = await PaperCategoryStorage.list()
		return { count: categories.length, categories }
	},
})
registerTool('listPaperCategories', { role: 'admin' })
