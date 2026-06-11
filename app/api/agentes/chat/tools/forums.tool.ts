import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { schemaForumThread } from '@/models/forums'
import { ForumStorage } from '@/services/forums-storage'

// ── listForumThreads ─────────────────────────────────────────────────

export const listForumThreads = tool({
	description:
		'List all forum threads in the platform. Returns thread summaries with uuid, title, slug, area, status, featured, createdBy, authorName, repliesCount, and lastActivityAt.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await ForumStorage.list()
		return {
			count: items.length,
			threads: items.map((t) => ({
				uuid: t.uuid,
				title: t.title,
				slug: t.slug,
				area: t.area,
				status: t.status,
				featured: t.featured,
				createdBy: t.createdBy,
				authorName: t.authorName,
				repliesCount: t.repliesCount,
				lastActivityAt: t.lastActivityAt,
				courseSlug: t.courseSlug,
				paperUuid: t.paperUuid,
			})),
		}
	},
})
registerTool('listForumThreads', { role: 'admin' })

// ── getForumThread ──────────────────────────────────────────────────

export const getForumThread = tool({
	description:
		'Get a single forum thread by UUID. Returns full thread data including content, imageUrls, documentUrls, videoUrls, and all metadata.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the forum thread to retrieve'),
	}),
	execute: async ({ uuid }) => {
		const thread = await ForumStorage.get(uuid)
		if (!thread) {
			return { error: 'Forum thread not found' }
		}
		return thread
	},
})
registerTool('getForumThread', { role: 'admin' })

// ── createForumThread ───────────────────────────────────────────────

export const createForumThread = tool({
	description:
		'Create a new forum thread. Title and area are required. Optional fields: content, courseSlug, paperUuid, authorName, status (open/closed/hidden), featured, imageUrls, documentUrls, videoUrls. Defaults: createdBy=system, status=open, featured=false.',
	inputSchema: schemaForumThread.omit({ uuid: true, slug: true }),
	execute: async (input) => {
		const thread = await ForumStorage.create({ ...input, createdBy: 'system' })
		return {
			uuid: thread.uuid,
			slug: thread.slug,
			title: thread.title,
			area: thread.area,
			status: thread.status,
			featured: thread.featured,
			message: 'Forum thread created successfully',
		}
	},
})
registerTool('createForumThread', { role: 'admin' })

// ── updateForumThread ───────────────────────────────────────────────

export const updateForumThread = tool({
	description:
		'Update an existing forum thread by UUID. Only the fields provided will be updated. All fields are optional except uuid.',
	inputSchema: schemaForumThread
		.partial()
		.extend({
			uuid: z
				.string()
				.uuid()
				.describe('The UUID of the forum thread to update'),
		}),
	execute: async ({ uuid, ...updates }) => {
		const thread = await ForumStorage.update(uuid, updates)
		if (!thread) {
			return { error: 'Forum thread not found' }
		}
		return {
			uuid: thread.uuid,
			slug: thread.slug,
			title: thread.title,
			area: thread.area,
			status: thread.status,
			featured: thread.featured,
			message: 'Forum thread updated successfully',
		}
	},
})
registerTool('updateForumThread', { role: 'admin' })

// ── deleteForumThread ───────────────────────────────────────────────

export const deleteForumThread = tool({
	description:
		'Delete a forum thread by UUID. This action cannot be undone. ⚠️ Requires operator approval before execution.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the forum thread to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await ForumStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Forum thread not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteForumThread', { role: 'admin', needsApproval: true })

// ── featureForumThread ──────────────────────────────────────────────

export const featureForumThread = tool({
	description:
		'Toggle the featured status of a forum thread by UUID. Featured threads appear prominently in the forum listing.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the forum thread to feature/unfeature'),
		featured: z
			.boolean()
			.describe('Set true to feature, false to unfeature'),
	}),
	execute: async ({ uuid, featured }) => {
		const thread = await ForumStorage.update(uuid, { featured })
		if (!thread) {
			return { error: 'Forum thread not found' }
		}
		return {
			uuid: thread.uuid,
			title: thread.title,
			featured: thread.featured,
			message: featured
				? 'Forum thread featured successfully'
				: 'Forum thread unfeatured successfully',
		}
	},
})
registerTool('featureForumThread', { role: 'admin' })
