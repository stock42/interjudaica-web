import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { schemaSocialProof } from '@/models/social-proof'
import { SocialProofStorage } from '@/services/social-proof-storage'

// ── listTestimonials ─────────────────────────────────────────────────

export const listTestimonials = tool({
	description:
		'List all social proof testimonials. Returns testimonial summaries with uuid, name, detail, quote, status, and order.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await SocialProofStorage.list()
		return {
			count: items.length,
			testimonials: items.map((t) => ({
				uuid: t.uuid,
				name: t.name,
				detail: t.detail,
				quote: t.quote,
				status: t.status,
				order: t.order,
			})),
		}
	},
})
registerTool('listTestimonials', { role: 'admin' })

// ── createTestimonial ───────────────────────────────────────────────

export const createTestimonial = tool({
	description:
		'Create a new testimonial. Name, detail (role/affiliation), and quote are required. Optional fields: status (draft/published, defaults to draft), order (display order, defaults to 0).',
	inputSchema: schemaSocialProof.omit({ uuid: true }),
	execute: async (input) => {
		const testimonial = await SocialProofStorage.create(input)
		return {
			uuid: testimonial.uuid,
			name: testimonial.name,
			detail: testimonial.detail,
			quote: testimonial.quote,
			status: testimonial.status,
			order: testimonial.order,
			message: 'Testimonial created successfully',
		}
	},
})
registerTool('createTestimonial', { role: 'admin' })

// ── updateTestimonial ───────────────────────────────────────────────

export const updateTestimonial = tool({
	description:
		'Update an existing testimonial by UUID. Only the fields provided will be updated. All fields are optional except uuid.',
	inputSchema: schemaSocialProof
		.partial()
		.extend({
			uuid: z
				.string()
				.uuid()
				.describe('The UUID of the testimonial to update'),
		}),
	execute: async ({ uuid, ...updates }) => {
		const testimonial = await SocialProofStorage.update(uuid, updates)
		if (!testimonial) {
			return { error: 'Testimonial not found' }
		}
		return {
			uuid: testimonial.uuid,
			name: testimonial.name,
			detail: testimonial.detail,
			quote: testimonial.quote,
			status: testimonial.status,
			order: testimonial.order,
			message: 'Testimonial updated successfully',
		}
	},
})
registerTool('updateTestimonial', { role: 'admin' })

// ── deleteTestimonial ───────────────────────────────────────────────

export const deleteTestimonial = tool({
	description:
		'Delete a testimonial by UUID. This action cannot be undone. ⚠️ Requires operator approval before execution.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the testimonial to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await SocialProofStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Testimonial not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteTestimonial', { role: 'admin', needsApproval: true })
