'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import type { TypeCrmCampaign } from '@/models/crm-campaigns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type FormState = {
	name: string
	description: string
}

function createFormState(campaign?: TypeCrmCampaign): FormState {
	return {
		name: campaign?.name ?? '',
		description: campaign?.description ?? '',
	}
}

export function CampaignForm({ campaign }: { campaign?: TypeCrmCampaign }) {
	const router = useRouter()
	const [form, setForm] = useState<FormState>(() => createFormState(campaign))
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const isEditing = Boolean(campaign?.uuid)

	function setField<K extends keyof FormState>(name: K, value: FormState[K]) {
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setLoading(true)
		setError('')

		const res = await fetch(
			isEditing
				? `/api/admin/crm/campaigns/${campaign!.uuid}`
				: '/api/admin/crm/campaigns',
			{
				method: isEditing ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
			},
		)

		setLoading(false)

		if (res.status === 401) {
			window.location.assign('/operator-login?next=/admin/crm/campaigns')
			return
		}

		const data = await res.json().catch(() => ({}))
		if (!res.ok) {
			setError(data.error ?? 'Could not save campaign.')
			return
		}

		router.push('/admin/crm/campaigns')
		router.refresh()
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-display text-2xl font-semibold">
						{isEditing ? 'Edit campaign' : 'New campaign'}
					</h2>
					<p className="mt-1 text-sm text-[var(--muted)]">
						{isEditing
							? 'Update campaign name and description.'
							: 'Create a new campaign to group contacts.'}
					</p>
				</div>
				<Link
					href="/admin/crm/campaigns"
					className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
				>
					Back to list
				</Link>
			</div>

			<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Name</Label>
					<Input
						className="h-11"
						value={form.name}
						onChange={(e) => setField('name', e.target.value)}
						required
					/>
				</div>
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Description</Label>
					<Textarea
						className="min-h-28"
						value={form.description}
						onChange={(e) => setField('description', e.target.value)}
					/>
				</div>

				{error && (
					<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
						{error}
					</p>
				)}

				<div className="flex flex-wrap gap-3 md:col-span-2">
					<Button type="submit" disabled={loading} className="h-11">
						{loading ? 'Saving…' : isEditing ? 'Update campaign' : 'Create campaign'}
					</Button>
					<Button asChild variant="outline" className="h-11">
						<Link href="/admin/crm/campaigns">Cancel</Link>
					</Button>
				</div>
			</form>
		</section>
	)
}
