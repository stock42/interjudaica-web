'use client'

import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

export function ClassCompletionToggle({
	classUuid,
	initialCompleted,
}: {
	classUuid: string
	initialCompleted: boolean
}) {
	const [completed, setCompleted] = useState(initialCompleted)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	async function toggleCompleted() {
		setSaving(true)
		setError('')
		const nextCompleted = !completed
		const response = await fetch(`/api/courses/classes/${classUuid}/progress`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ completed: nextCompleted }),
		})
		setSaving(false)

		if (!response.ok) {
			setError('Progress could not be saved.')
			return
		}

		setCompleted(nextCompleted)
	}

	return (
		<div className="grid gap-2">
			<button
				type="button"
				className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] px-3 text-sm font-semibold text-[var(--gold)] transition hover:bg-[rgba(244,189,51,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
				disabled={saving}
				onClick={toggleCompleted}
				aria-pressed={completed}
			>
				{completed ?
					<CheckCircle2 className="h-4 w-4" />
				:	<Circle className="h-4 w-4" />}
				{saving ?
					'Saving'
				: completed ?
					'Completed'
				:	'Mark complete'}
			</button>
			{error ?
				<p className="text-xs font-semibold text-[var(--sumac)]">{error}</p>
			:	null}
		</div>
	)
}
