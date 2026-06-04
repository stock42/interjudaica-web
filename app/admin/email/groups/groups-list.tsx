'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TypeEmailGroup } from '@/models/email-groups'
import { Button } from '@/components/ui/button'

export function EmailGroupsList() {
	const router = useRouter()
	const [items, setItems] = useState<TypeEmailGroup[]>([])
	const [loading, setLoading] = useState(false)
	const [deleting, setDeleting] = useState('')

	useEffect(() => {
		async function fetchItems() {
			setLoading(true)
			const res = await fetch('/api/admin/email/groups')
			if (res.ok) setItems((await res.json()).items ?? [])
			setLoading(false)
		}
		fetchItems()
	}, [])

	async function handleDelete(g: TypeEmailGroup) {
		if (!g.uuid || !confirm(`Delete "${g.name}"?`)) return
		setDeleting(g.uuid)
		await fetch(`/api/admin/email/groups/${g.uuid}`, { method: 'DELETE' })
		setDeleting('')
		router.refresh();
	}

	return (
		<div className="grid gap-5">
			<div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-white p-4">
				<span className="text-sm text-[var(--muted)]">{items.length} group{items.length !== 1 ? 's' : ''}</span>
				<Button asChild size="lg"><Link href="/admin/email/groups/new">New group</Link></Button>
			</div>
			<div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[30rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr><th className="px-4 py-3 font-bold">Name</th><th className="px-4 py-3 font-bold">Promoting</th><th className="px-4 py-3 font-bold">Has Query</th><th className="px-4 py-3 font-bold">Actions</th></tr>
						</thead>
						<tbody>
							{loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Loading…</td></tr>
							: items.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No groups yet.</td></tr>
							: items.map(g => (
								<tr key={g.uuid} className="border-t border-[var(--line)] align-middle">
									<td className="px-4 py-4 font-semibold text-[var(--ink)]">{g.name}</td>
									<td className="px-4 py-4 text-[var(--muted)]">{g.promoting?.slice(0, 60)}{(g.promoting?.length ?? 0) > 60 ? '…' : ''}</td>
									<td className="px-4 py-4">{g.query ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Yes</span> : <span className="text-xs text-[var(--muted)]">—</span>}</td>
									<td className="px-4 py-4">
										<div className="flex flex-wrap gap-2">
											<Button asChild variant="outline" size="xs" className="rounded-full"><Link href={`/admin/email/groups/${g.uuid}`}>Edit</Link></Button>
											<button className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60" disabled={deleting === g.uuid} onClick={() => handleDelete(g)}>{deleting === g.uuid ? '…' : 'Delete'}</button>
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
