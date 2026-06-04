'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import type { TypeCrmCampaign } from '@/models/crm-campaigns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminTextControlClass } from '@/app/admin/components/admin-controls'

export function CampaignList() {
	const router = useRouter()
	const [campaigns, setCampaigns] = useState<(TypeCrmCampaign & { contactCount?: number })[]>([])
	const [loading, setLoading] = useState(false)
	const [deletingUuid, setDeletingUuid] = useState('')
	const [query, setQuery] = useState('')

	const fetchCampaigns = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch('/api/admin/crm/campaigns')
			if (res.status === 401) {
				window.location.assign('/operator-login?next=/admin/crm/campaigns')
				return
			}
			const data = await res.json()
			setCampaigns(data.items ?? [])
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchCampaigns()
	}, [fetchCampaigns])

	async function handleDelete(campaign: TypeCrmCampaign) {
		if (!campaign.uuid || !window.confirm(`Delete "${campaign.name}"? This will also remove all contact assignments.`)) {
			return
		}
		setDeletingUuid(campaign.uuid)
		const res = await fetch(`/api/admin/crm/campaigns/${campaign.uuid}`, { method: 'DELETE' })
		setDeletingUuid('')
		if (res.status === 401) {
			window.location.assign('/operator-login?next=/admin/crm/campaigns')
			return
		}
		if (!res.ok) {
			window.alert('Could not delete campaign.')
			return
		}
		router.refresh()
		fetchCampaigns()
	}

	const filtered = query.trim()
		? campaigns.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
		: campaigns

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<label className="grid flex-1 gap-2 text-sm font-semibold text-[var(--ink)]">
						Search campaigns
						<Input
							className={adminTextControlClass}
							type="search"
							placeholder="Campaign name"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</label>
					<Button size="lg" className="h-11" asChild>
						<Link href="/admin/crm/campaigns/new">New campaign</Link>
					</Button>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[40rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Name</th>
								<th className="px-4 py-3 font-bold">Description</th>
								<th className="px-4 py-3 font-bold">Contacts</th>
								<th className="px-4 py-3 font-bold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading && campaigns.length === 0 ? (
								<tr>
									<td className="px-4 py-8 text-center text-sm text-[var(--muted)]" colSpan={4}>
										Loading…
									</td>
								</tr>
							) : filtered.length === 0 ? (
								<tr>
									<td className="px-4 py-8 text-center text-sm text-[var(--muted)]" colSpan={4}>
										No campaigns found.
									</td>
								</tr>
							) : (
								filtered.map((c) => (
									<tr key={c.uuid} className="border-t border-[var(--line)] align-middle">
										<td className="px-4 py-4 font-semibold text-[var(--ink)]">{c.name}</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{c.description ? (c.description.length > 80 ? c.description.slice(0, 80) + '…' : c.description) : '—'}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">{c.contactCount ?? 0}</td>
										<td className="px-4 py-4">
											<div className="flex flex-wrap gap-2">
												<Button asChild variant="outline" size="xs" className="rounded-full">
													<Link href={`/admin/crm/campaigns/${c.uuid}`}>Edit</Link>
												</Button>
												<button
													className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
													type="button"
													disabled={deletingUuid === c.uuid}
													onClick={() => handleDelete(c)}
												>
													{deletingUuid === c.uuid ? 'Deleting…' : 'Delete'}
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
