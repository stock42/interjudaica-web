'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import type { TypeEmailTemplate } from '@/models/email-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type FormState = { name: string; subject: string; html: string }

function createState(t?: TypeEmailTemplate): FormState {
	return { name: t?.name ?? '', subject: t?.subject ?? '', html: t?.html ?? '' }
}

export function TemplateForm({ template }: { template?: TypeEmailTemplate }) {
	const router = useRouter()
	const [form, setForm] = useState<FormState>(() => createState(template))
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [llmOpen, setLlmOpen] = useState(false)
	const [llmPrompt, setLlmPrompt] = useState('')
	const [llmLoading, setLlmLoading] = useState(false)
	const isEditing = !!template?.uuid

	function setField<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(p => ({ ...p, [k]: v })) }

	async function handleSubmit(e: FormEvent) {
		e.preventDefault(); setLoading(true); setError('')
		const res = await fetch(isEditing ? `/api/admin/email/templates/${template!.uuid}` : '/api/admin/email/templates', {
			method: isEditing ? 'PATCH' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})
		setLoading(false)
		if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Could not save.'); return }
		router.push('/admin/email/templates'); router.refresh()
	}

	async function handleGenerateHtml() {
		setLlmLoading(true); setError('')
		try {
			const res = await fetch('/api/agentes/generate-template', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ promoting: llmPrompt }),
			})
			const d = await res.json()
			if (!res.ok) { setError(d.error ?? 'AI generation failed'); return }
			setField('html', d.html)
			setLlmOpen(false)
		} finally { setLlmLoading(false) }
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex items-center justify-between">
				<div><h2 className="font-display text-2xl font-semibold">{isEditing ? 'Edit template' : 'New template'}</h2></div>
				<Link href="/admin/email/templates" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:bg-[var(--paper)]">Back</Link>
			</div>
			<form className="grid gap-4" onSubmit={handleSubmit}>
				<div className="grid gap-2"><Label>Name</Label><Input className="h-11" value={form.name} onChange={e => setField('name', e.target.value)} required /></div>
				<div className="grid gap-2"><Label>Subject</Label><Input className="h-11" value={form.subject} onChange={e => setField('subject', e.target.value)} required /></div>
				<div className="grid gap-2">
					<div className="flex items-center justify-between"><Label>HTML</Label><Button type="button" variant="outline" size="sm" onClick={() => setLlmOpen(true)}>🤖 Generate with AI</Button></div>
					<Textarea className="min-h-48 font-mono text-xs" value={form.html} onChange={e => setField('html', e.target.value)} />
				</div>
				{error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
				<div className="flex gap-3"><Button type="submit" disabled={loading}>{loading ? 'Saving…' : isEditing ? 'Update' : 'Create'}</Button><Button asChild variant="outline"><Link href="/admin/email/templates">Cancel</Link></Button></div>
			</form>
			<Dialog open={llmOpen} onOpenChange={setLlmOpen}>
				<DialogContent>
					<DialogHeader><DialogTitle>Generate HTML with AI</DialogTitle></DialogHeader>
					<div className="grid gap-3">
						<Label>Describe the email you want</Label>
						<Textarea className="min-h-24" value={llmPrompt} onChange={e => setLlmPrompt(e.target.value)} placeholder="e.g. A warm welcome email for new students of InterJudaica, mentioning our courses and community…" />
						<Button onClick={handleGenerateHtml} disabled={llmLoading || !llmPrompt.trim()}>{llmLoading ? 'Generating…' : 'Generate HTML'}</Button>
					</div>
				</DialogContent>
			</Dialog>
		</section>
	)
}
