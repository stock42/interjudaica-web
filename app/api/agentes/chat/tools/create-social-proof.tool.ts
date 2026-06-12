import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { SocialProofStorage } from '@/services/social-proof-storage'

// ── createTestimonial ────────────────────────────────────────────────

export const createTestimonial = tool({
	description:
		'Create a new testimonial. Quote, name, and detail (role/affiliation) are required. Optional: order (display order, defaults to 0), status (draft/published, defaults to draft).',
	inputSchema: z.object({
		quote: z.string().min(4).describe('Testimonial quote text'),
		name: z.string().min(2).describe('Person name'),
		detail: z.string().min(2).describe('Role or affiliation detail'),
		order: z
			.coerce
			.number()
			.int()
			.min(0)
			.default(0)
			.describe('Display order'),
		status: z
			.enum(['draft', 'published'])
			.optional()
			.describe('Publishing status'),
	}),
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
