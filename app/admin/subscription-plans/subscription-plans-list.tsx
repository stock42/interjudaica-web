'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminTextControlClass } from '@/app/admin/components/admin-controls'
import { AdminStatPill } from '@/app/admin/components/admin-stat-pill'

import type { TypeSubscriptionPlan } from '@/models/subscription-plans'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formatUsd = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 2,
})

function priceLabel(price: number, billingInterval: string) {
	const amount = formatUsd.format(price / 100)
	const suffix = billingInterval === 'year' ? '/year' : '/month'
	return `${amount} USD${suffix}`
}

function statusBadge(active: boolean) {
	return active ? (
		<span className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-bold uppercase text-green-700">
			Active
		</span>
	) : (
		<span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
			Archived
		</span>
	)
}

export function SubscriptionPlansList({
	plans,
}: {
	plans: TypeSubscriptionPlan[]
}) {
	const router = useRouter()
	const [query, setQuery] = useState('')
	const [deletingUuid, setDeletingUuid] = useState('')
	const normalizedQuery = query.trim().toLowerCase()

	const filteredPlans = useMemo(
		() =>
			plans.filter((plan) => {
				if (!normalizedQuery) return true
				return [plan.name, plan.description]
					.join(' ')
					.toLowerCase()
					.includes(normalizedQuery)
			}),
		[plans, normalizedQuery],
	)

	async function deletePlan(plan: TypeSubscriptionPlan) {
		if (!plan.uuid || !window.confirm(`Delete ${plan.name}?`)) {
			return
		}
		setDeletingUuid(plan.uuid)
		const response = await fetch(
			`/api/admin/subscription-plans/${plan.uuid}`,
			{ method: 'DELETE' },
		)
		setDeletingUuid('')
		if (response.status === 401) {
			window.location.assign(
				'/operator-login?next=/admin/subscription-plans',
			)
			return
		}
		if (!response.ok) {
			window.alert('The plan could not be deleted.')
			return
		}
		router.refresh()
	}

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<label className="grid flex-1 gap-2 text-sm font-semibold text-[var(--ink)]">
						Search plans
						<Input
							className={adminTextControlClass}
							type="search"
							placeholder="Plan name or description"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</label>
					<Button asChild size="lg" className="h-11">
						<Link href="/admin/subscription-plans/new">
							New plan
						</Link>
					</Button>
				</div>
				<div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase text-[var(--muted)]">
					<AdminStatPill>
						{filteredPlans.length} visible
					</AdminStatPill>
					<AdminStatPill>{plans.length} total</AdminStatPill>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[48rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Name</th>
								<th className="px-4 py-3 font-bold">Price</th>
								<th className="px-4 py-3 font-bold">Billing</th>
								<th className="px-4 py-3 font-bold">Status</th>
								<th className="px-4 py-3 font-bold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredPlans.length === 0 ? (
								<tr>
									<td
										className="px-4 py-8 text-center text-sm text-[var(--muted)]"
										colSpan={5}
									>
										No plans match the current search.
									</td>
								</tr>
							) : (
								filteredPlans.map((plan) => (
									<tr
										key={plan.uuid}
										className="border-t border-[var(--line)] align-top"
									>
										<td className="px-4 py-4">
											<p className="font-semibold text-[var(--ink)]">
												{plan.name}
											</p>
											{plan.description ? (
												<p className="mt-1 text-xs text-[var(--muted)]">
													{plan.description}
												</p>
											) : null}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{priceLabel(
												plan.price,
												plan.billingInterval,
											)}
										</td>
										<td className="px-4 py-4 text-[var(--muted)] capitalize">
											{plan.billingInterval}ly
										</td>
										<td className="px-4 py-4">
											{statusBadge(plan.active)}
										</td>
										<td className="px-4 py-4">
											<div className="flex flex-wrap gap-2">
												<Button
													asChild
													variant="outline"
													size="xs"
													className="rounded-full"
												>
													<Link
														href={`/admin/subscription-plans/${plan.uuid}`}
													>
														Edit
													</Link>
												</Button>
												<button
													className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
													type="button"
													disabled={
														deletingUuid ===
														plan.uuid
													}
													onClick={() =>
														deletePlan(plan)
													}
												>
													{deletingUuid === plan.uuid
														? 'Deleting'
														: 'Delete'}
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	)
}
