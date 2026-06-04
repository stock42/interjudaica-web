'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import type { TypeEmailCampaign } from '@/models/email-campaigns'
import type { TypeEmailTemplate } from '@/models/email-templates'
import type { TypeEmailGroup } from '@/models/email-groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type FormState = { name: string; templateUuid: string; groupUuid: string; deliveryTime: string }

function createState(c?: TypeEmailCampaign): FormState {
	return {
		name: c?.name ?? '',
		templateUuid: c?.templateUuid ?? '',
		groupUuid: c?.groupUuid ?? '',
		deliveryTime: c?.deliveryTime ?? '',
	}
}

export function CampaignForm({ campaign }: { campaign?: TypeEmailCampaign }) {
	const router = useRouter()
	const [form, setForm] = useState<FormState>(() => createState(campaign))
	const [templates, setTemplates] = useState<TypeEmailTemplate[]>([])
	const [groups, setGroups] = useState<TypeEmailGroup[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const isEditing = !!campaign?.uuid

	useEffect(() => {
		fetch('/api/admin/email/templates').then(r => r.json()).then(d => setTemplates(d.items ?? []))
		fetch('/api/admin/email/groups').then(r => r.json()).then(d => setGroups(d.items ?? []))
	}, [])

	function setField<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(p => ({ ...p, [k]: v })) }

	async function handleSubmit(e: FormEvent) {
		e.preventDefault(); setLoading(true); setError('')
		const body = {
			name: form.name,
			templateUuid: form.templateUuid,
			groupUuid: form.groupUuid,
			deliveryTime: form.deliveryTime || null,
		}
		const res = await fetch(isEditing ? `/api/admin/email/campaigns/${campaign!.uuid}` : '/api/admin/email/campaigns', {
			method: isEditing ? 'PATCH' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		setLoading(false)
		if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Could not save.'); return }
		router.push('/admin/email/campaigns'); router.refresh()
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex items-center justify-between">
				<div><h2 className="font-display text-2xl font-semibold">{isEditing ? 'Edit campaign' : 'New campaign'}</h2></div>
				<Link href="/admin/email/campaigns" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:bg-[var(--paper)]">Back</Link>
			</div>
			<form className="grid gap-4" onSubmit={handleSubmit}>
				<div className="grid gap-2"><Label>Campaign name</Label><Input className="h-11" value={form.name} onChange={e => setField('name', e.target.value)} required /></div>
				<div className="grid gap-2">
					<Label>Template</Label>
					<select className="h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm" value={form.templateUuid} onChange={e => setField('templateUuid', e.target.value)} required>
						<option value="">Select a template…</option>
						{templates.map(t => <option key={t.uuid} value={t.uuid}>{t.name}</option>)}
					</select>
				</div>
				<div className="grid gap-2">
					<Label>Group</Label>
					<select className="h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm" value={form.groupUuid} onChange={e => setField('groupUuid', e.target.value)} required>
						<option value="">Select a group…</option>
						{groups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
					</select>
				</div>
				<div className="grid gap-2">
					<Label>Delivery time (optional, leave blank for immediate)</Label>
					<Input className="h-11" type="datetime-local" value={form.deliveryTime} onChange={e => setField('deliveryTime', e.target.value)} />
				</div>
				{error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
				<div className="flex gap-3"><Button type="submit" disabled={loading}>{loading ? 'Saving…' : isEditing ? 'Update' : 'Create'}</Button><Button asChild variant="outline"><Link href="/admin/email/campaigns">Cancel</Link></Button></div>
			</form>
		</section>
	)
}
