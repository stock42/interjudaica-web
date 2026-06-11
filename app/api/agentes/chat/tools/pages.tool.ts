import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { schemaPage } from '@/models/pages'
import { PageStorage } from '@/services/pages-storage'

// ── listPages ───────────────────────────────────────────────────────

export const listPages = tool({
	description:
		'List all CMS pages. Returns page summaries with uuid, title, slug, description, and status.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await PageStorage.list()
		return {
			count: items.length,
			pages: items.map((p) => ({
				uuid: p.uuid,
				title: p.title,
				slug: p.slug,
				description: p.description,
				status: p.status,
			})),
		}
	},
})
registerTool('listPages', { role: 'admin' })

// ── getPage ─────────────────────────────────────────────────────────

export const getPage = tool({
	description:
		'Get a single CMS page by UUID. Returns full page data including title, slug, description, content, and status.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the page to retrieve'),
	}),
	execute: async ({ uuid }) => {
		const page = await PageStorage.get(uuid)
		if (!page) {
			return { error: 'Page not found' }
		}
		return page
	},
})
registerTool('getPage', { role: 'admin' })

// ── createPage ──────────────────────────────────────────────────────

export const createPage = tool({
	description:
		'Create a new CMS page. Title is required. Slug is auto-generated from title. Optional fields: description, content (max 100K chars), status (draft/published/archived, defaults to draft).',
	inputSchema: schemaPage.omit({ uuid: true, slug: true }),
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

// ── updatePage ──────────────────────────────────────────────────────

export const updatePage = tool({
	description:
		'Update an existing CMS page by UUID. Only the fields provided will be updated. Slug is regenerated when the title changes.',
	inputSchema: schemaPage
		.partial()
		.extend({
			uuid: z
				.string()
				.uuid()
				.describe('The UUID of the page to update'),
		}),
	execute: async ({ uuid, ...updates }) => {
		const page = await PageStorage.update(uuid, updates)
		if (!page) {
			return { error: 'Page not found' }
		}
		return {
			uuid: page.uuid,
			slug: page.slug,
			title: page.title,
			status: page.status,
			message: 'Page updated successfully',
		}
	},
})
registerTool('updatePage', { role: 'admin' })

// ── deletePage ──────────────────────────────────────────────────────

export const deletePage = tool({
	description:
		'Delete a CMS page by UUID. This action cannot be undone. ⚠️ Requires operator approval before execution.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the page to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await PageStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Page not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deletePage', { role: 'admin', needsApproval: true })
