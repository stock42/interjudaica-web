'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TypeEmailTemplate } from '@/models/email-templates'
import { Button } from '@/components/ui/button'

export function EmailTemplatesList() {
	const router = useRouter()
	const [items, setItems] = useState<TypeEmailTemplate[]>([])
	const [loading, setLoading] = useState(false)
	const [deleting, setDeleting] = useState('')

	useEffect(() => {
		async function fetchItems() {
			setLoading(true)
			const res = await fetch('/api/admin/email/templates')
			if (res.ok) {
				const d = await res.json()
				setItems(d.items ?? [])
			}
			setLoading(false)
		}
		fetchItems()
	}, [])

	async function handleDelete(t: TypeEmailTemplate) {
		if (!t.uuid || !confirm(`Delete "${t.name}"?`)) return
		setDeleting(t.uuid)
		await fetch(`/api/admin/email/templates/${t.uuid}`, { method: 'DELETE' })
		setDeleting('')
		router.refresh()
	}

	return (
		<div className="grid gap-5">
			<div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-white p-4">
				<span className="text-sm text-[var(--muted)]">{items.length} template{items.length !== 1 ? 's' : ''}</span>
				<Button asChild size="lg"><Link href="/admin/email/templates/new">New template</Link></Button>
			</div>
			<div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[30rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr><th className="px-4 py-3 font-bold">Name</th><th className="px-4 py-3 font-bold">Subject</th><th className="px-4 py-3 font-bold">Actions</th></tr>
						</thead>
						<tbody>
							{loading ? <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Loading…</td></tr>
							: items.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No templates yet.</td></tr>
							: items.map(t => (
								<tr key={t.uuid} className="border-t border-[var(--line)] align-middle">
									<td className="px-4 py-4 font-semibold text-[var(--ink)]">{t.name}</td>
									<td className="px-4 py-4 text-[var(--muted)]">{t.subject?.slice(0, 60)}{(t.subject?.length ?? 0) > 60 ? '…' : ''}</td>
									<td className="px-4 py-4">
										<div className="flex flex-wrap gap-2">
											<Button asChild variant="outline" size="xs" className="rounded-full"><Link href={`/admin/email/templates/${t.uuid}`}>Edit</Link></Button>
											<button className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60" disabled={deleting === t.uuid} onClick={() => handleDelete(t)}>
												{deleting === t.uuid ? '…' : 'Delete'}
											</button>
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
