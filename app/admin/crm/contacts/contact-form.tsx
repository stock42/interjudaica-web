'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { TypeCrmContact } from '@/models/crm-contacts'
import type { TypeCrmTag } from '@/models/crm-tags'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TextField, TextareaField, FieldWrapper } from '@/app/components/form-fields'

type FormState = {
	firstname: string
	lastname: string
	email: string
	notes: string
}

function createFormState(contact?: TypeCrmContact): FormState {
	return {
		firstname: contact?.firstname ?? '',
		lastname: contact?.lastname ?? '',
		email: contact?.email ?? '',
		notes: contact?.notes ?? '',
	}
}

export function ContactForm({
	contact,
}: {
	contact?: TypeCrmContact & { tagNames?: string[] }
}) {
	const router = useRouter()
	const [form, setForm] = useState<FormState>(() => createFormState(contact))
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [tagInput, setTagInput] = useState('')
	const [tagNames, setTagNames] = useState<string[]>(
		() => contact?.tagNames ?? [],
	)
	const [allTags, setAllTags] = useState<TypeCrmTag[]>([])
	const [showSuggestions, setShowSuggestions] = useState(false)
	const tagInputRef = useRef<HTMLInputElement>(null)
	const suggestionsRef = useRef<HTMLDivElement>(null)
	const isEditing = Boolean(contact?.uuid)

	// Fetch all tags on mount for autocomplete suggestions
	useEffect(() => {
		fetch('/api/admin/crm/tags')
			.then((res) => {
				if (res.ok) return res.json()
				throw new Error()
			})
			.then((data) => setAllTags(data.items ?? []))
			.catch(() => {
				/* tags fetch is optional — autocomplete just won't show */
			})
	}, [])

	// Filter suggestions based on typed text
	const tagSuggestions = useMemo(() => {
		if (!tagInput.trim() || allTags.length === 0) return []
		const q = tagInput.toLowerCase()
		const existing = new Set(tagNames.map((n) => n.toLowerCase()))
		return allTags.filter(
			(t) =>
				t.name.includes(q) && !existing.has(t.name.toLowerCase()),
		)
	}, [tagInput, allTags, tagNames])

	// Close suggestions when clicking outside
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(e.target as Node) &&
				tagInputRef.current &&
				!tagInputRef.current.contains(e.target as Node)
			) {
				setShowSuggestions(false)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])

	function setField<K extends keyof FormState>(name: K, value: FormState[K]) {
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	function addTag(name: string) {
		const normalized = name.trim()
		if (!normalized) return
		if (
			tagNames.some((n) => n.toLowerCase() === normalized.toLowerCase())
		) {
			setTagInput('')
			return
		}
		setTagNames((prev) => [...prev, normalized])
		setTagInput('')
		setShowSuggestions(false)
	}

	function removeTag(name: string) {
		setTagNames((prev) => prev.filter((n) => n !== name))
	}

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			const body: Record<string, unknown> = {
				firstname: form.firstname,
				lastname: form.lastname,
				email: form.email,
				notes: form.notes,
				tags: tagNames,
			}

			const res = await fetch(
				isEditing
					? `/api/admin/crm/contacts/${contact!.uuid}`
					: '/api/admin/crm/contacts',
				{
					method: isEditing ? 'PATCH' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				},
			)

			if (res.status === 401) {
				window.location.assign(
					'/operator-login?next=/admin/crm/contacts',
				)
				return
			}

			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				setError(data.error ?? 'Could not save contact.')
				return
			}

			router.push('/admin/crm/contacts')
			router.refresh()
		} finally {
			setLoading(false)
		}
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-display text-2xl font-semibold">
						{isEditing ? 'Edit contact' : 'New contact'}
					</h2>
					<p className="mt-1 text-sm text-[var(--muted)]">
						{isEditing
							? 'Update contact details and tags.'
							: 'Create a new CRM contact with tags.'}
					</p>
				</div>
				<Link
					href="/admin/crm/contacts"
					className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
				>
					Back to list
				</Link>
			</div>

			<form
				className="grid gap-4 md:grid-cols-2"
				onSubmit={handleSubmit}
			>
				<TextField
					label="First name"
					value={form.firstname}
					onChange={(value) => setField('firstname', value)}
				/>
				<TextField
					label="Last name"
					value={form.lastname}
					onChange={(value) => setField('lastname', value)}
				/>
				<TextField
					label="Email"
					type="email"
					value={form.email}
					onChange={(value) => setField('email', value)}
				/>

				{/* Tags section */}
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Tags</Label>
					<div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
						{tagNames.map((name) => (
							<span
								key={name}
								className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1 text-xs font-medium"
							>
								{name}
								<button
									type="button"
									className="text-[var(--muted)] hover:text-[var(--sumac)]"
									onClick={() => removeTag(name)}
									aria-label={`Remove tag "${name}"`}
								>
									&times;
								</button>
							</span>
						))}
						<div className="relative flex-1">
							<Input
								ref={tagInputRef}
								className="h-8 min-w-[8rem] border-0 bg-transparent px-1 text-sm shadow-none focus:ring-0"
								placeholder="Add tag..."
								value={tagInput}
								onChange={(e) => {
									setTagInput(e.target.value)
									if (e.target.value.trim()) {
										setShowSuggestions(true)
									}
								}}
								onFocus={() => {
									if (tagInput.trim()) setShowSuggestions(true)
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ',') {
										e.preventDefault()
										addTag(tagInput)
									}
								}}
							/>
							{showSuggestions &&
								tagSuggestions.length > 0 && (
									<div
										ref={suggestionsRef}
										className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-[var(--line)] bg-white shadow-lg"
									>
										{tagSuggestions.map((tag) => (
											<button
												key={tag.uuid}
												type="button"
												className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--paper)]"
												onClick={() =>
													addTag(tag.name)
												}
											>
												{tag.name}
											</button>
										))}
									</div>
								)}
						</div>
					</div>
					<p className="text-xs text-[var(--muted)]">
						Type a tag name and press Enter or comma to add.
						Existing tags appear as suggestions.
					</p>
				</div>

				{/* Notes */}
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
						<TextareaField
						label="Notes (markdown)"
						value={form.notes}
						onChange={(value) => setField('notes', value)}
						rows={6}
					/>
					{isEditing && contact?.notesUpdatedAt && (
						<p className="text-xs text-[var(--muted)]">
							Last updated:{' '}
							{new Date(
								contact.notesUpdatedAt,
							).toLocaleString()}
						</p>
					)}
				</div>

				{error && (
					<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
						{error}
					</p>
				)}

				<div className="flex flex-wrap gap-3 md:col-span-2">
					<Button type="submit" disabled={loading} className="h-11">
						{loading
							? 'Saving...'
							: isEditing
								? 'Update contact'
								: 'Create contact'}
					</Button>
					<Button asChild variant="outline" className="h-11">
						<Link href="/admin/crm/contacts">Cancel</Link>
					</Button>
				</div>
			</form>
		</section>
	)
}
