import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { OwnerBioStorage } from '@/services/owner-bio-storage'

// ── updateOwnerBio ───────────────────────────────────────────────────

export const updateOwnerBio = tool({
	description:
		'Update the owner biography (Ernesto Yattah). This is a singleton — it upserts by the slug "ernesto-yattah". Provide title and/or markdown content. If the bio does not exist it will be created.',
	inputSchema: z.object({
		title: z
			.string()
			.optional()
			.describe('Owner display title (e.g., "Ernesto Yattah")'),
		markdown: z
			.string()
			.optional()
			.describe('Owner biography content in markdown'),
	}),
	execute: async ({ title, markdown }) => {
		const bio = await OwnerBioStorage.upsertBySlug('ernesto-yattah', {
			title,
			markdown,
		})
		return {
			uuid: bio.uuid,
			slug: bio.slug,
			title: bio.title,
			message: 'Owner bio updated successfully',
		}
	},
})
registerTool('updateOwnerBio', { role: 'admin' })
