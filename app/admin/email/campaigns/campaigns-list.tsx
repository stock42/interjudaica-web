'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type CampaignItem = {
	uuid?: string; name: string; templateUuid: string; groupUuid: string
	status: string; deliveryTime: string | null
	templateName: string; groupName: string
	stats: { total: number; sent: number; error: number; new: number }
}

const statusColors: Record<string, string> = {
	draft: 'bg-gray-100 text-gray-700', running: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700',
}

export function CampaignsList() {
	const router = useRouter()
	const [items, setItems] = useState<CampaignItem[]>([])
	const [loading, setLoading] = useState(false)
	const [deleting, setDeleting] = useState('')

	useEffect(() => {
		async function fetchItems() {
			setLoading(true)
			const res = await fetch('/api/admin/email/campaigns')
			if (res.ok) setItems((await res.json()).items ?? [])
			setLoading(false)
		}
		fetchItems()
	}, [])

	async function handleDelete(c: CampaignItem) {
		if (!c.uuid || !confirm(`Delete "${c.name}"?`)) return
		setDeleting(c.uuid)
		await fetch(`/api/admin/email/campaigns/${c.uuid}`, { method: 'DELETE' })
		setDeleting('')
		router.refresh();
	}

	return (
		<div className="grid gap-5">
			<div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-white p-4">
				<span className="text-sm text-[var(--muted)]">{items.length} campaign{items.length !== 1 ? 's' : ''}</span>
				<Button asChild size="lg"><Link href="/admin/email/campaigns/new">New campaign</Link></Button>
			</div>
			<div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[40rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Name</th><th className="px-4 py-3 font-bold">Template</th><th className="px-4 py-3 font-bold">Group</th>
								<th className="px-4 py-3 font-bold">Stats</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Loading…</td></tr>
							: items.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No campaigns yet.</td></tr>
							: items.map(c => (
								<tr key={c.uuid} className="border-t border-[var(--line)] align-middle">
									<td className="px-4 py-4 font-semibold text-[var(--ink)]">{c.name}</td>
									<td className="px-4 py-4 text-[var(--muted)]">{c.templateName}</td>
									<td className="px-4 py-4 text-[var(--muted)]">{c.groupName}</td>
									<td className="px-4 py-4 text-xs"><span className="text-green-700 font-bold">{c.stats?.sent ?? 0}</span> sent / <span className="text-red-700 font-bold">{c.stats?.error ?? 0}</span> err / <span className="font-bold">{c.stats?.total ?? 0}</span> total</td>
									<td className="px-4 py-4"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColors[c.status] ?? 'bg-gray-100 text-gray-700'}`}>{c.status}</span></td>
									<td className="px-4 py-4">
										<div className="flex flex-wrap gap-2">
											<Button asChild variant="outline" size="xs" className="rounded-full"><Link href={`/admin/email/campaigns/${c.uuid}`}>View</Link></Button>
											<button className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60" disabled={deleting === c.uuid} onClick={() => handleDelete(c)}>{deleting === c.uuid ? '…' : 'Delete'}</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
