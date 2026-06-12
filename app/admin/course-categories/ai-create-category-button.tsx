'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import AiCreateModal from '@/app/admin/components/ai-create-modal'
import { Button } from '@/components/ui/button'

export function AiCreateCategoryButton({
	className,
}: {
	className?: string
}) {
	const router = useRouter()

	return (
		<AiCreateModal
			entityType="course-category"
			entityName="Course Category"
			onCreate={async (data) => {
				const response = await fetch('/api/admin/course-categories', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				})

				if (response.status === 401) {
					window.location.assign(
						'/operator-login?next=/admin/course-categories',
					)
					return
				}

				if (!response.ok) {
					const err = await response.json().catch(() => ({}))
					throw new Error(err.error ?? 'The category could not be created.')
				}

				router.push('/admin/course-categories')
				router.refresh()
			}}
			trigger={
				<Button className={className}>
					<Sparkles data-icon="inline-start" />
					Create with AI
				</Button>
			}
		/>
	)
}
