'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

import AiCreateModal from '@/app/admin/components/ai-create-modal'
import { Button } from '@/components/ui/button'

const SYSTEM_PROMPT = `You are creating an instructor for a Jewish education platform called InterJudaica.
Generate a JSON object with these fields:
- firstName (string, required): The instructor's first name
- lastName (string, required): The instructor's last name
- displayName (string, optional): Full display name (auto-generated from first+last if omitted)
- email (string, optional): Professional email address
- bio (string): A professional biography in English (2-4 paragraphs), written in third person. Highlight teaching experience, academic credentials, areas of expertise in Jewish studies, and what students appreciate about their teaching style.
- photoUrl (string, optional): Leave as empty string ""
- enabled (boolean): true`

export function InstructorAiCreateButton({
	className,
}: {
	className?: string
}) {
	const router = useRouter()

	async function handleCreate(data: Record<string, unknown>) {
		const response = await fetch('/api/admin/instructors', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		})

		if (response.status === 401) {
			window.location.assign('/operator-login?next=/admin/instructors')
			return
		}

		if (!response.ok) {
			const err = await response.json().catch(() => ({}))
			throw new Error(err.error ?? 'Failed to create instructor')
		}

		router.push('/admin/instructors')
		router.refresh()
	}

	return (
		<AiCreateModal
			entityType="instructor"
			entityName="Instructor"
			onCreate={handleCreate}
			systemPrompt={SYSTEM_PROMPT}
			trigger={
				<Button variant="outline" className={className}>
					<Sparkles
						className="size-4"
						data-icon="inline-start"
					/>
					AI Create
				</Button>
			}
		/>
	)
}
