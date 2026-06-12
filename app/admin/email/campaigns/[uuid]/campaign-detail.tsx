'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { TypeEmailCampaign } from '@/models/email-campaigns'
import type { TypeEmailSpooler } from '@/models/email-spooler'
import { Button } from '@/components/ui/button'

type CampaignWithStats = TypeEmailCampaign & {
	stats: { total: number; sent: number; error: number; new: number }
}

const statusBadge: Record<string, string> = {
	new: 'bg-blue-100 text-blue-700', sent: 'bg-green-100 text-green-700', error: 'bg-red-100 text-red-700',
}

export function CampaignDetail({ campaign }: { campaign: CampaignWithStats }) {
	const router = useRouter()
	const [running, setRunning] = useState(false)
	const [retrying, setRetrying] = useState(false)
	const [stopping, setStopping] = useState(false)
	const [spooler, setSpooler] = useState<TypeEmailSpooler[]>([])
	const [spoolerPage, setSpoolerPage] = useState(1)
	const [spoolerTotal, setSpoolerTotal] = useState(0)
	const [spoolerFilter, setSpoolerFilter] = useState('')
	const [result, setResult] = useState('')
	const [reloadKey, setReloadKey] = useState(0)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			const params = new URLSearchParams({ page: String(spoolerPage), limit: '20' })
			if (spoolerFilter) params.set('status', spoolerFilter)
			const res = await fetch(`/api/admin/email/campaigns/${campaign.uuid}/spooler?${params}`)
			if (cancelled || !res.ok) return
			const d = await res.json()
			setSpooler(d.items ?? [])
			setSpoolerTotal(d.count ?? 0)
		})()
		return () => { cancelled = true }
	}, [campaign.uuid, spoolerPage, spoolerFilter, reloadKey])

	async function handleRun() {
		if (!confirm('Initialize campaign? This will generate emails for all matching contacts.')) return
		setRunning(true); setResult('')
		const res = await fetch(`/api/admin/email/campaigns/${campaign.uuid}/run`, { method: 'POST' })
		const d = await res.json().catch(() => ({}))
		setResult(d.message ?? d.error ?? 'Done')
		setRunning(false)
		router.refresh(); setReloadKey(k => k + 1)
	}

	async function handleRetry() {
		if (!confirm('Retry all failed emails for this campaign?')) return
		setRetrying(true); setResult('')
		const res = await fetch(`/api/admin/email/campaigns/${campaign.uuid}/retry`, { method: 'POST' })
		const d = await res.json().catch(() => ({}))
		setResult(`${d.retried ?? 0} emails queued for retry.`)
		setRetrying(false); setReloadKey(k => k + 1)
	}

	async function handleStop() {
		if (!confirm('⚠️ Stop this campaign? This will cancel all pending emails and mark the campaign as stopped. This action cannot be undone.')) return
		setStopping(true); setResult('')
		const res = await fetch(`/api/admin/email/campaigns/${campaign.uuid}/stop`, { method: 'POST' })
		const d = await res.json().catch(() => ({}))
		if (res.ok) {
			setResult('Campaign stopped. All pending emails cancelled.')
			router.refresh()
		} else {
			setResult(d.error ?? 'Failed to stop campaign.')
		}
		setStopping(false); setReloadKey(k => k + 1)
	}

	return (
		<div className="grid gap-6">
			{/* Stats bar */}
			<section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{['total', 'sent', 'error', 'new'].map(k => (
					<div key={k} className="rounded-lg border border-[var(--line)] bg-white p-4 text-center">
						<p className="text-2xl font-bold text-[var(--ink)]">{campaign.stats?.[k as keyof typeof campaign.stats] ?? 0}</p>
						<p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{k}</p>
					</div>
				))}
			</section>

			{/* Actions */}
			<section className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--line)] bg-white p-4">
				<Button onClick={handleRun} disabled={running} className="h-10">{running ? 'Initializing…' : '▶ Run campaign'}</Button>
				{campaign.status === 'running' && (
					<Button onClick={handleStop} disabled={stopping} className="h-10 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500">
						{stopping ? 'Stopping…' : '⏹ STOP campaign'}
					</Button>
				)}
				<Button onClick={handleRetry} disabled={retrying} variant="outline" className="h-10">{retrying ? 'Retrying…' : '↻ Retry all errors'}</Button>
				<Button asChild variant="outline" className="h-10"><Link href={`/admin/email/campaigns/${campaign.uuid}`}>Edit campaign</Link></Button>
				<Link href="/admin/email/campaigns" className="text-sm text-[var(--muted)] hover:underline">Back to list</Link>
				{result && <span className="text-sm font-semibold text-green-700">{result}</span>}
			</section>

			{/* Spooler */}
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-display text-xl font-semibold">Email Queue</h3>
					<div className="flex items-center gap-2">
						<select className="h-9 rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 text-xs" value={spoolerFilter} onChange={e => { setSpoolerFilter(e.target.value); setSpoolerPage(1) }}>
							<option value="">All</option><option value="new">New</option><option value="sent">Sent</option><option value="error">Error</option>
						</select>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[30rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr><th className="px-3 py-2 font-bold">To</th><th className="px-3 py-2 font-bold">Status</th><th className="px-3 py-2 font-bold">Error</th><th className="px-3 py-2 font-bold">Actions</th></tr>
						</thead>
						<tbody>
							{spooler.length === 0 ? <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-[var(--muted)]">No emails yet. Run the campaign to generate them.</td></tr>
							: spooler.map(s => (
								<tr key={s.uuid} className="border-t border-[var(--line)] align-middle">
									<td className="px-3 py-3 text-[var(--ink)]">{s.to}</td>
									<td className="px-3 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${statusBadge[s.status] ?? ''}`}>{s.status}</span></td>
									<td className="px-3 py-3 text-xs text-red-600 max-w-[12rem] truncate">{s.error || '—'}</td>
									<td className="px-3 py-3">
										<div className="flex gap-2">
											<Button asChild variant="outline" size="xs"><Link href={`/admin/email/campaigns/${campaign.uuid}/spooler/${s.uuid}`}>Preview</Link></Button>
											{s.status === 'error' && (
												<Button size="xs" variant="outline" className="text-xs" onClick={async () => {
													await fetch(`/api/admin/email/campaigns/${campaign.uuid}/spooler/${s.uuid}/retry`, { method: 'POST' })
													setReloadKey(k => k + 1)
												}}>Retry</Button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{spoolerTotal > 20 && (
					<div className="mt-3 flex items-center justify-between">
						<span className="text-xs text-[var(--muted)]">{spoolerTotal} emails total</span>
						<div className="flex gap-2">
							<Button size="sm" variant="outline" disabled={spoolerPage <= 1} onClick={() => setSpoolerPage(p => p - 1)}>Previous</Button>
							<Button size="sm" variant="outline" disabled={spoolerPage * 20 >= spoolerTotal} onClick={() => setSpoolerPage(p => p + 1)}>Next</Button>
						</div>
					</div>
				)}
			</section>
		</div>
	)
}
