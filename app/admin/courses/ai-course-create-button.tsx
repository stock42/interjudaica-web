'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

import AiCreateModal from '@/app/admin/components/ai-create-modal'
import { Button } from '@/components/ui/button'

const SYSTEM_PROMPT = `You are generating data for a new InterJudaica course. The course is a Jewish studies / Torah learning course for English-speaking students in the United States.

Required fields:
- title (required, 2-200 chars): A compelling educational course title
- category (required, 2-100 chars): Course category name (e.g., "Torah Foundations", "Talmud", "Jewish Philosophy", "Hebrew Language")
- categorySlug (optional): URL-friendly version of the category name

Optional fields with defaults:
- level: "Beginner", "Intermediate", or "Advanced"
- price: number in USD (default 0)
- communityPrice: number in USD for community members (default 0)
- durationHours: total course duration in hours (default 0)
- startDate: course start date as string
- endDate: course end date as string
- instructor: instructor display name (default "Ernesto Yattah")
- instructorSlug: URL-friendly instructor name (default "ernesto-yattah")
- maxStudents: integer, maximum enrollment (default 0)
- status: "draft", "published", or "archived" (default "draft")
- summary: short one-paragraph course summary
- description: full course description with markdown formatting
- includes: array of strings listing what the course includes
- outcomes: array of strings listing learning outcomes
- stripePaymentLink: Stripe payment URL (default "")
- thumbnailImageUrl: thumbnail image URL (default "")
- coverImageUrl: cover image URL (default "")
- accent: accent color hex (default "#164a9f")

Important: Generate Jewish-studies-appropriate content. Use USD for prices. Keep the tone educational and welcoming.`

export default function AiCourseCreateButton() {
	const router = useRouter()
	const [creating, setCreating] = useState(false)

	async function handleCreate(data: Record<string, unknown>) {
		setCreating(true)

		try {
			const response = await fetch('/api/admin/courses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			})

			if (response.status === 401) {
				window.location.assign(
					'/operator-login?next=/admin/courses',
				)
				return
			}

			if (!response.ok) {
				const err = await response.json().catch(() => ({}))
				throw new Error(
					err.error || 'The course could not be created.',
				)
			}

			const result = await response.json()
			const uuid = result.item?.uuid

			if (uuid) {
				router.push(`/admin/courses/${uuid}`)
			} else {
				router.push('/admin/courses')
			}
			router.refresh()
		} catch (error) {
			setCreating(false)
			throw error
		}
	}

	return (
		<AiCreateModal
			entityType="course"
			entityName="Course"
			systemPrompt={SYSTEM_PROMPT}
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
