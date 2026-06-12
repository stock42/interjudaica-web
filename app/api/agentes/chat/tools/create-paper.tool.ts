import 'server-only'

import { tool } from 'ai'
import { registerTool } from '@/lib/llm-tool-auth'
import { schemaPaper } from '@/models/papers'
import { PaperStorage } from '@/services/papers-storage'
import { ForumStorage } from '@/services/forums-storage'

// ── createPaper ─────────────────────────────────────────────────────

export const createPaper = tool({
	description:
		'Create a new paper. Title is required. Optional fields: categoryUuid, author (defaults to "Ernesto Yattah"), visibility (public/community/private), summary, content, status, date, category, categorySlug. Auto-creates a linked forum thread in "Community Papers" area.',
	inputSchema: schemaPaper.omit({ uuid: true, slug: true }),
	execute: async (input) => {
		const paper = await PaperStorage.create(input)

		// Auto-create forum thread (mirrors admin API pattern)
		const existingThread = await ForumStorage.getByPaperUuid(paper.uuid ?? '')
		if (!existingThread) {
			await ForumStorage.create({
				title: paper.title,
				area: 'Community Papers',
				paperUuid: paper.uuid ?? '',
				createdBy: 'system',
				content: paper.summary || 'New paper published',
				status: 'open',
			})
		}

		return paper
	},
})
registerTool('createPaper', { role: 'admin' })
