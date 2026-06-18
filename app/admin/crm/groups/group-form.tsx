'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import type { TypeCrmGroup } from '@/models/crm-groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type FormState = { name: string; description: string; query: string; contactCount: number }

function createState(g?: TypeCrmGroup): FormState {
	return { name: g?.name ?? '', description: g?.description ?? '', query: g?.query ?? '', contactCount: g?.contactCount ?? 0 }
}

export function GroupForm({ group }: { group?: TypeCrmGroup }) {
	const router = useRouter()
	const [form, setForm] = useState<FormState>(() => createState(group))
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [llmLoading, setLlmLoading] = useState(false)
	const isEditing = !!group?.uuid

	function setField<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(p => ({ ...p, [k]: v })) }

	async function handleSubmit(e: FormEvent) {
		e.preventDefault(); setLoading(true); setError('')
		const res = await fetch(isEditing ? `/api/admin/crm/groups/${group!.uuid}` : '/api/admin/crm/groups', {
			method: isEditing ? 'PATCH' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})
		setLoading(false)
		if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Could not save.'); return }
		router.push('/admin/crm/groups'); router.refresh()
	}

	async function handleGenerateQuery() {
		setLlmLoading(true); setError('')
		try {
			const res = await fetch('/api/agentes/generate-query', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ promoting: form.description }),
			})
			const d = await res.json()
			if (!res.ok) { setError(d.error ?? 'AI generation failed'); return }
			try {
				const parsed = JSON.parse(d.query)
				setField('query', JSON.stringify(parsed, null, 2))
			} catch {
				setField('query', d.query)
			}
		} finally { setLlmLoading(false) }
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex items-center justify-between">
				<div><h2 className="font-display text-2xl font-semibold">{isEditing ? 'Edit group' : 'New group'}</h2></div>
				<Link href="/admin/crm/groups" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:bg-[var(--paper)]">Back</Link>
			</div>
			<form className="grid gap-4" onSubmit={handleSubmit}>
				<div className="grid gap-2"><Label>Name</Label><Input className="h-11" value={form.name} onChange={e => setField('name', e.target.value)} required /></div>
				<div className="grid gap-2">
					<div className="flex items-center justify-between"><Label>Description (describe your target segment)</Label><Button type="button" variant="outline" size="sm" onClick={handleGenerateQuery} disabled={llmLoading || !form.description.trim()}>{llmLoading ? 'Thinking…' : '🤖 Generate query'}</Button></div>
					<Textarea className="min-h-20" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="e.g. Contacts in Argentina who enrolled in a course…" />
				</div>
				<div className="grid gap-2">
					<Label>MongoDB Query (auto-generated)</Label>
					<Textarea className="min-h-32 font-mono text-xs" value={form.query} onChange={e => setField('query', e.target.value)} placeholder="Click 'Generate query' to create one automatically…" />
				</div>
				<div className="grid gap-2">
					<Label>Contact Count (cached)</Label>
					<Input className="h-11" type="number" value={form.contactCount} onChange={e => setField('contactCount', parseInt(e.target.value) || 0)} min={0} />
				</div>
				{error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
				<div className="flex gap-3"><Button type="submit" disabled={loading}>{loading ? 'Saving…' : isEditing ? 'Update' : 'Create'}</Button><Button asChild variant="outline"><Link href="/admin/crm/groups">Cancel</Link></Button></div>
			</form>
		</section>
	)
}
