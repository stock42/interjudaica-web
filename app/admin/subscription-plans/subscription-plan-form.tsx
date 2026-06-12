'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Sparkles } from 'lucide-react'
import AiCreateModal from '@/app/admin/components/ai-create-modal'
import type { TypeSubscriptionPlan } from '@/models/subscription-plans'

type PlanFormState = {
	name: string
	description: string
	price: string
	billingInterval: string
	active: boolean
}

function createFormState(plan?: TypeSubscriptionPlan): PlanFormState {
	return {
		name: plan?.name ?? '',
		description: plan?.description ?? '',
		price: String(plan?.price ?? 0),
		billingInterval: plan?.billingInterval ?? 'month',
		active: plan?.active ?? true,
	}
}

export function SubscriptionPlanForm({
	plan,
}: {
	plan?: TypeSubscriptionPlan
}) {
	const router = useRouter()
	const [form, setForm] = useState(() => createFormState(plan))
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const isEditing = Boolean(plan?.uuid)

	function setField(name: keyof PlanFormState, value: string | boolean) {
		setForm((current) => ({ ...current, [name]: value }))
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setLoading(true)
		setError('')

		const body = {
			name: form.name,
			description: form.description,
			price: Number(form.price || 0),
			billingInterval: form.billingInterval,
			active: form.active,
		}

		const response = await fetch(
			isEditing
				? `/api/admin/subscription-plans/${plan?.uuid}`
				: '/api/admin/subscription-plans',
			{
				method: isEditing ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			},
		)

		setLoading(false)

		if (response.status === 401) {
			window.location.assign(
				'/operator-login?next=/admin/subscription-plans',
			)
			return
		}

		if (!response.ok) {
			const data = await response.json().catch(() => ({}))
			setError(data.error ?? 'The plan could not be saved.')
			return
		}

		router.push('/admin/subscription-plans')
		router.refresh()
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-display text-2xl font-semibold">
						{isEditing ? 'Edit plan' : 'New plan'}
					</h2>
					<p className="mt-1 text-sm text-[var(--muted)]">
						Price is in cents (e.g. 1900 = $19.00). Stripe price
						will be created on checkout.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<AiCreateModal
						entityType="subscription-plan"
						entityName="Subscription Plan"
						trigger={
							<Button variant="outline" size="sm" className="h-10 gap-1.5">
								<Sparkles className="size-4 text-[var(--gold)]" />
								AI Create
							</Button>
						}
						onCreate={async (data) => {
							const response = await fetch('/api/admin/subscription-plans', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(data),
							})
							if (response.status === 401) {
								window.location.assign('/operator-login?next=/admin/subscription-plans')
								return
							}
							if (!response.ok) {
								const json = await response.json().catch(() => ({}))
								throw new Error(json.error ?? 'Failed to create subscription plan')
							}
							const created = await response.json()
							router.push(`/admin/subscription-plans/${created.item.uuid}`)
							router.refresh()
						}}
					/>
					<Link
						href="/admin/subscription-plans"
						className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
					>
						Back to list
					</Link>
				</div>
			</div>

			<form
				className="grid gap-4 md:grid-cols-2"
				onSubmit={handleSubmit}
			>
				<div className="grid gap-2 md:col-span-2">
					<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
						<Label>Name</Label>
						<Input
							className="h-11"
							value={form.name}
							onChange={(event) =>
								setField('name', event.target.value)
							}
						/>
					</div>
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					<Label>Price (cents)</Label>
					<Input
						className="h-11"
						min={0}
						step={1}
						type="number"
						value={form.price}
						onChange={(event) =>
							setField('price', event.target.value)
						}
					/>
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					<Label>Billing interval</Label>
					<Select
						value={form.billingInterval}
						onValueChange={(value) =>
							setField('billingInterval', value)
						}
					>
						<SelectTrigger className="h-11 w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="month">Monthly</SelectItem>
							<SelectItem value="year">Yearly</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Description</Label>
					<Textarea
						className="min-h-24"
						value={form.description}
						onChange={(event) =>
							setField('description', event.target.value)
						}
					/>
				</div>

				<div className="flex items-center gap-3 md:col-span-2">
					<input
						id="plan-active"
						type="checkbox"
						className="h-5 w-5 rounded border-[var(--line)] accent-[var(--sapphire)]"
						checked={form.active}
						onChange={(event) =>
							setField('active', event.target.checked)
						}
					/>
					<Label htmlFor="plan-active">Active</Label>
				</div>

				{error ? (
					<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
						{error}
					</p>
				) : null}

				<div className="flex flex-wrap gap-3 md:col-span-2">
					<Button type="submit" disabled={loading}>
						{loading ? 'Saving…' : 'Save plan'}
					</Button>
					<Button asChild variant="outline">
						<Link href="/admin/subscription-plans">Cancel</Link>
					</Button>
				</div>
			</form>
		</section>
	)
}
