'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TypeCrmGroup } from '@/models/crm-groups'
import type { TypeCrmContact } from '@/models/crm-contacts'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export function CrmGroupsList() {
	const router = useRouter()
	const [items, setItems] = useState<TypeCrmGroup[]>([])
	const [loading, setLoading] = useState(false)
	const [deleting, setDeleting] = useState('')
	const [runningPreview, setRunningPreview] = useState<string | null>(null)
	const [previewResults, setPreviewResults] = useState<Record<string, { count: number; items: TypeCrmContact[] }>>({})
	const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({})

	useEffect(() => {
		async function fetchItems() {
			setLoading(true)
			const res = await fetch('/api/admin/crm/groups')
			if (res.ok) setItems((await res.json()).items ?? [])
			setLoading(false)
		}
		fetchItems()
	}, [])

	async function handleRun(uuid: string) {
		setRunningPreview(uuid)
		setPreviewErrors(prev => { const next = {...prev}; delete next[uuid]; return next })
		try {
			const res = await fetch(`/api/admin/crm/groups/${uuid}/preview`)
			const data = await res.json()
			if (!res.ok) {
				setPreviewErrors(prev => ({ ...prev, [uuid]: data.error ?? 'Failed to run query' }))
				return
			}
			setPreviewResults(prev => ({ ...prev, [uuid]: data }))
		} catch {
			setPreviewErrors(prev => ({ ...prev, [uuid]: 'Network error' }))
		} finally {
			setRunningPreview(null)
		}
	}

	async function handleDelete(g: TypeCrmGroup) {
		if (!g.uuid || !confirm(`Delete "${g.name}"?`)) return
		setDeleting(g.uuid)
		await fetch(`/api/admin/crm/groups/${g.uuid}`, { method: 'DELETE' })
		setDeleting('')
		router.refresh()
	}

	return (
		<div className="grid gap-5">
			<div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-white p-4">
				<span className="text-sm text-[var(--muted)]">{items.length} group{items.length !== 1 ? 's' : ''}</span>
				<Button asChild size="lg"><Link href="/admin/crm/groups/new">New group</Link></Button>
			</div>
			<div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[30rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr><th className="px-4 py-3 font-bold">Name</th><th className="px-4 py-3 font-bold">Description</th><th className="px-4 py-3 font-bold">Contact Count</th><th className="px-4 py-3 font-bold">Has Query</th><th className="px-4 py-3 font-bold">Actions</th></tr>
						</thead>
						<tbody>
							{loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Loading…</td></tr>
							: items.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No groups yet.</td></tr>
							: items.map(g => {
								const preview = g.uuid ? previewResults[g.uuid] : null
								const previewErr = g.uuid ? previewErrors[g.uuid] : null
								const isRunning = runningPreview === g.uuid
								return (
								<>
									<tr key={g.uuid} className="border-t border-[var(--line)] align-middle">
										<td className="px-4 py-4 font-semibold text-[var(--ink)]">{g.name}</td>
										<td className="px-4 py-4 text-[var(--muted)]">{g.description?.slice(0, 80)}{(g.description?.length ?? 0) > 80 ? '…' : ''}</td>
										<td className="px-4 py-4"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{g.contactCount ?? 0}</span></td>
										<td className="px-4 py-4">{g.query ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Yes</span> : <span className="text-xs text-[var(--muted)]">—</span>}</td>
										<td className="px-4 py-4">
											<div className="flex flex-wrap items-center gap-2">
												{g.query && (
													<button
														type="button"
														className="inline-flex items-center gap-1 rounded-full border border-[var(--sapphire)] px-3 py-1.5 text-xs font-bold text-[var(--sapphire)] transition hover:bg-[var(--sapphire)] hover:text-white disabled:opacity-60"
														disabled={isRunning}
														onClick={() => g.uuid && handleRun(g.uuid)}
														title="Preview matching contacts"
													>
														<Play className="h-3 w-3" />
														{isRunning ? '…' : 'Run'}
													</button>
												)}
												<Button asChild variant="outline" size="xs" className="rounded-full"><Link href={`/admin/crm/groups/${g.uuid}`}>Edit</Link></Button>
												<button className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60" disabled={deleting === g.uuid} onClick={() => handleDelete(g)}>{deleting === g.uuid ? '…' : 'Delete'}</button>
											</div>
										</td>
									</tr>
									{(preview || previewErr) && (
										<tr key={`${g.uuid}-preview`} className="border-t border-[var(--line)] bg-[var(--paper)]">
											<td colSpan={5} className="px-4 py-3">
												{previewErr ? (
													<p className="text-xs font-semibold text-red-600">{previewErr}</p>
												) : preview ? (
													<div className="space-y-1">
														<p className="text-xs font-semibold">
															<span className="text-[var(--ink)]">{preview.count}</span>{' '}
															<span className="text-[var(--muted)]">contact{preview.count !== 1 ? 's' : ''} matched</span>
														</p>
														{preview.count > 0 && preview.items.slice(0, 5).map((c, i) => (
															<p key={i} className="text-xs text-[var(--muted)]">{c.firstname} {c.lastname} — {c.email}</p>
														))}
														{preview.count > 5 && (
															<p className="text-xs text-[var(--muted)]">+{preview.count - 5} more…</p>
														)}
													</div>
												) : null}
											</td>
										</tr>
									)}
								</>
							)})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
