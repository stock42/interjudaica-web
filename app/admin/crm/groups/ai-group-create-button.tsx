'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Users } from 'lucide-react'

import AiCreateModal from '@/app/admin/components/ai-create-modal'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

const SYSTEM_PROMPT = `You are generating a CRM contact group for InterJudaica. Given a natural-language description of contacts to segment, produce a complete CRM group.

Required fields:
- name (required, 2-300 chars): A concise, descriptive group name (e.g., "Argentina Enrollees")
- description (required): A brief description of the target segment for operator reference
- query (required): A MongoDB query filter as a JSON STRING for the "crm_contacts" collection
- contactCount (optional): Set to 0 initially

The crm_contacts collection has documents with shape:
{ uuid, data: { firstname, lastname, email, notes, notesUpdatedAt, tags: string[] } }

MongoDB query rules:
- Use dot notation: "data.firstname", "data.email", etc.
- For text matching use $regex with $options: "i" for case-insensitive
- For tag UUIDs use $in: ["data.tags"]
- For date ranges use $gte/$lte on "data.notesUpdatedAt"
- The query field must be a valid JSON OBJECT serialized as a STRING (with escaped quotes)

Examples of good output:
- "Contacts named David in New York" → { "name": "New York Davids", "description": "Contacts named David in the New York area", "query": "{\\"data.firstname\\": \\"David\\", \\"data.notes\\": {\\"$regex\\": \\"New York\\", \\"$options\\": \\"i\\"}}" }
- "All contacts" → { "name": "All Contacts", "description": "All contacts in the CRM", "query": "{}" }

Always use $options: "i" for regex queries. If the description is too vague, use an empty query {}. Respond ONLY with valid JSON wrapped in a \`\`\`json code block.`

export default function AiCrmGroupCreateButton() {
	const router = useRouter()
	const [creating, setCreating] = useState(false)
	const [contactCount, setContactCount] = useState<number | null>(null)
	const [countLoading, setCountLoading] = useState(false)

	const handleDataParsed = useCallback(
		async (data: Record<string, unknown>) => {
			const query = data.query
			if (!query || typeof query !== 'string') {
				setContactCount(null)
				return
			}

			setCountLoading(true)
			setContactCount(null)

			try {
				const res = await fetch(
					'/api/admin/crm/groups/preview-contacts',
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ query }),
					},
				)
				if (res.ok) {
					const result = await res.json()
					setContactCount(result.count ?? 0)
				}
			} catch {
				setContactCount(null)
			} finally {
				setCountLoading(false)
			}
		},
		[],
	)

	const previewExtra =
		countLoading ? (
			<div className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
				<Spinner className="size-4" />
				Counting matching contacts…
			</div>
		) : contactCount !== null ? (
			<div className="mt-2 flex items-center gap-2 text-sm">
				<Users className="size-4 text-[var(--jade)]" />
				<span className="font-semibold text-[var(--jade)]">
					{contactCount}
				</span>
				<span className="text-[var(--muted)]">
					matching contact{contactCount !== 1 ? 's' : ''}
				</span>
			</div>
		) : null

	async function handleCreate(data: Record<string, unknown>) {
		setCreating(true)

		try {
			const response = await fetch('/api/admin/crm/groups', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})

			if (response.status === 401) {
				window.location.assign(
					'/operator-login?next=/admin/crm/groups',
				)
				return
			}

			if (!response.ok) {
				const err = await response.json().catch(() => ({}))
				throw new Error(
					err.error || 'The group could not be created.',
				)
			}

			const result = await response.json()
			const uuid = result.item?.uuid

			if (uuid) {
				router.push(`/admin/crm/groups/${uuid}`)
			} else {
				router.push('/admin/crm/groups')
			}
			router.refresh()
		} catch (error) {
			setCreating(false)
			throw error
		}
	}

	return (
		<AiCreateModal
			entityType="crm-group"
			entityName="CRM Group"
			systemPrompt={SYSTEM_PROMPT}
			onDataParsed={handleDataParsed}
			previewExtra={previewExtra}
			onCreate={handleCreate}
			trigger={
				<Button
					variant="outline"
					className="border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)]/10"
					disabled={creating}
				>
					<Sparkles className="size-4" data-icon="inline-start" />
					Create with AI
				</Button>
			}
		/>
	)
}
