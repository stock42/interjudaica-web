'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TypeCrmContact } from '@/models/crm-contacts'
import type { TypeCrmTag } from '@/models/crm-tags'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { adminTextControlClass } from '@/app/admin/components/admin-controls'

export function ContactList() {
	const router = useRouter()
	const [contacts, setContacts] = useState<TypeCrmContact[]>([])
	const [allTags, setAllTags] = useState<TypeCrmTag[]>([])
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalCount, setTotalCount] = useState(0)
	const [query, setQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [deletingUuid, setDeletingUuid] = useState('')
	const [tagInput, setTagInput] = useState('')
	const [importOpen, setImportOpen] = useState(false)
	const [refreshKey, setRefreshKey] = useState(0)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Debounce search input
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			setDebouncedQuery(query.trim())
			setPage(1)
		}, 350)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [query])

	// Load tags once on mount
	useEffect(() => {
		let cancelled = false
		async function load() {
			try {
				const res = await fetch('/api/admin/crm/tags')
				if (!cancelled && res.ok) {
					const data = await res.json()
					setAllTags(data.items ?? [])
				}
			} catch {
				// Tags are non-critical; silently ignore failures
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [])

	// Fetch contacts when page, query, or tag filters change
	useEffect(() => {
		let cancelled = false
		async function load() {
			setLoading(true)
			setError('')
			try {
				const params = new URLSearchParams()
				params.set('page', String(page))
				params.set('limit', '25')
				if (debouncedQuery) params.set('q', debouncedQuery)
				if (selectedTagIds.length > 0)
					params.set('tags', selectedTagIds.join(','))

				const res = await fetch(`/api/admin/crm/contacts?${params}`)
				if (res.status === 401) {
					window.location.assign('/operator-login?next=/admin/crm/contacts')
					return
				}
				if (!cancelled) {
					if (!res.ok) {
						setError('Failed to load contacts. Please try again.')
						return
					}
					const data = await res.json()
					setContacts(data.items ?? [])
					setTotalPages(data.totalPages ?? 1)
					setTotalCount(data.count ?? 0)
				}
			} catch {
				if (!cancelled) {
					setError('Failed to load contacts. Please check your connection.')
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [page, debouncedQuery, selectedTagIds, refreshKey])

	function toggleTag(tagUuid: string) {
		setSelectedTagIds((prev) =>
			prev.includes(tagUuid)
				? prev.filter((id) => id !== tagUuid)
				: [...prev, tagUuid],
		)
		setPage(1)
	}

	async function handleDelete(contact: TypeCrmContact) {
		if (
			!contact.uuid ||
			!window.confirm(`Delete ${contact.firstname} ${contact.lastname}?`)
		) {
			return
		}
		setDeletingUuid(contact.uuid)
		setError('')
		try {
			const res = await fetch(`/api/admin/crm/contacts/${contact.uuid}`, {
				method: 'DELETE',
			})
			setDeletingUuid('')
			if (res.status === 401) {
				window.location.assign('/operator-login?next=/admin/crm/contacts')
				return
			}
			if (!res.ok) {
				window.alert('Could not delete contact.')
				return
			}
			router.refresh()
			setRefreshKey((k) => k + 1)
		} catch {
			setDeletingUuid('')
			window.alert('Could not delete contact. Please try again.')
		}
	}

	function handleExport() {
		const params = new URLSearchParams()
		if (debouncedQuery) params.set('q', debouncedQuery)
		if (selectedTagIds.length > 0)
			params.set('tags', selectedTagIds.join(','))
		window.open(`/api/admin/crm/contacts/export?${params}`, '_blank')
	}

	const filteredTags = useMemo(() => {
		if (!tagInput.trim()) return allTags
		const q = tagInput.toLowerCase()
		return allTags.filter((t) => t.name.includes(q))
	}, [allTags, tagInput])

	const selectedTags = useMemo(
		() => allTags.filter((t) => t.uuid && selectedTagIds.includes(t.uuid)),
		[allTags, selectedTagIds],
	)

	return (
		<div className="grid gap-5">
			{/* Error banner */}
			{error && (
				<section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
					{error}
				</section>
			)}

			{/* Filters bar */}
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<div className="grid flex-1 gap-3 md:grid-cols-[minmax(14rem,1fr)_auto]">
						<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
							Search contacts
							<Input
								className={adminTextControlClass}
								type="search"
								placeholder="Search contacts..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</label>
						<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
							<span>Filter by tag</span>
							<div className="relative">
								<Input
									className={adminTextControlClass}
									type="text"
									placeholder="Type tag name..."
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
								/>
								{tagInput && filteredTags.length > 0 && (
									<div className="absolute z-10 mt-1 w-full rounded-md border border-[var(--line)] bg-white shadow-lg">
										{filteredTags.map((tag) => (
											<button
												key={tag.uuid}
												type="button"
												className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--paper)]"
												onClick={() => {
													if (tag.uuid) toggleTag(tag.uuid)
													setTagInput('')
												}}
											>
												{tag.name}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button size="lg" className="h-11" asChild>
							<Link href="/admin/crm/contacts/new">
								New Contact
							</Link>
						</Button>
						<Button
							size="lg"
							className="h-11"
							variant="outline"
							onClick={() => setImportOpen(!importOpen)}
						>
							Import CSV
						</Button>
						<Button
							size="lg"
							className="h-11"
							variant="outline"
							onClick={handleExport}
						>
							Export CSV
						</Button>
					</div>
				</div>

				{selectedTags.length > 0 && (
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<span className="text-xs font-semibold text-[var(--muted)]">
							Active filters:
						</span>
						{selectedTags.map((tag) => (
							<Badge
								key={tag.uuid}
								variant="secondary"
								className="cursor-pointer"
								onClick={() => tag.uuid && toggleTag(tag.uuid)}
							>
								{tag.name} ✕
							</Badge>
						))}
						<button
							type="button"
							className="text-xs font-semibold text-[var(--sumac)] hover:underline"
							onClick={() => {
								setSelectedTagIds([])
								setPage(1)
							}}
						>
							Clear all
						</button>
					</div>
				)}
			</section>

			{/* Import panel */}
			{importOpen && (
				<CsvImportPanel
					onClose={() => setImportOpen(false)}
					onImported={() => {
						setImportOpen(false)
						setRefreshKey((k) => k + 1)
					}}
				/>
			)}

			{/* Table */}
			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[50rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">First Name</th>
								<th className="px-4 py-3 font-bold">Last Name</th>
								<th className="px-4 py-3 font-bold">Email</th>
								<th className="px-4 py-3 font-bold">Tags</th>
								<th className="px-4 py-3 font-bold">Notes</th>
								<th className="px-4 py-3 font-bold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading && contacts.length === 0 ? (
								<tr>
									<td
										className="px-4 py-8 text-center text-sm text-[var(--muted)]"
										colSpan={6}
									>
										Loading...
									</td>
								</tr>
							) : contacts.length === 0 ? (
								<tr>
									<td
										className="px-4 py-8 text-center text-sm text-[var(--muted)]"
										colSpan={6}
									>
										No contacts found.
									</td>
								</tr>
							) : (
								contacts.map((c) => (
									<tr
										key={c.uuid}
										className="border-t border-[var(--line)] align-middle"
									>
										<td className="px-4 py-4 font-semibold text-[var(--ink)]">
											{c.firstname}
										</td>
										<td className="px-4 py-4 text-[var(--ink)]">
											{c.lastname}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{c.email}
										</td>
										<td className="px-4 py-4">
											<div className="flex flex-wrap gap-1">
												{(c.tags ?? []).map((tagUuid) => {
													const tag = allTags.find(
														(t) => t.uuid === tagUuid,
													)
													return tag ? (
														<span
															key={tagUuid}
															className="inline-block rounded-full border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 text-xs text-[var(--muted)]"
														>
															{tag.name}
														</span>
													) : null
												})}
											</div>
										</td>
										<td className="px-4 py-4">
											{c.notes ? (
												<span className="text-xs text-[var(--sapphire)]">
													Has notes
												</span>
											) : (
												<span className="text-xs text-[var(--muted)]">
													—
												</span>
											)}
										</td>
										<td className="px-4 py-4">
											<div className="flex flex-wrap gap-2">
												<Button
													asChild
													variant="outline"
													size="xs"
													className="rounded-full"
												>
													<Link
														href={`/admin/crm/contacts/${c.uuid}`}
													>
														Edit
													</Link>
												</Button>
												<button
													className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
													type="button"
													disabled={deletingUuid === c.uuid}
													onClick={() => handleDelete(c)}
												>
													{deletingUuid === c.uuid
														? 'Deleting…'
														: 'Delete'}
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

			{/* Pagination — always visible */}
			<div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-white px-4 py-3">
				<span className="text-sm text-[var(--muted)]">
					Page {page} of {totalPages} ({totalCount}{' '}
					{totalCount === 1 ? 'contact' : 'contacts'})
				</span>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => Math.max(1, p - 1))}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= totalPages}
						onClick={() =>
							setPage((p) => Math.min(totalPages, p + 1))
						}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	)
}

function CsvImportPanel({
	onClose,
	onImported,
}: {
	onClose: () => void
	onImported: () => void
}) {
	const [file, setFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)
	const [result, setResult] = useState<{
		imported: number
		skipped: number
	} | null>(null)
	const [error, setError] = useState('')

	async function handleUpload() {
		if (!file) return
		setUploading(true)
		setError('')
		setResult(null)

		const formData = new FormData()
		formData.set('file', file)

		try {
			const res = await fetch('/api/admin/crm/contacts/import', {
				method: 'POST',
				body: formData,
			})

			setUploading(false)
			if (res.status === 401) {
				window.location.assign(
					'/operator-login?next=/admin/crm/contacts',
				)
				return
			}

			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				setError(data.error ?? 'Import failed')
				return
			}
			setResult(data)
		} catch {
			setUploading(false)
			setError('Import failed. Please check your connection and try again.')
		}
	}

	return (
		<section className="rounded-lg border border-[var(--sapphire)] bg-blue-50/30 p-4 sm:p-5">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-lg font-semibold text-[var(--ink)]">
					Import contacts from CSV
				</h3>
				<button
					type="button"
					className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
					onClick={onClose}
				>
					Close
				</button>
			</div>
			<p className="mb-4 text-sm text-[var(--muted)]">
				Upload a CSV file with columns:{' '}
				<code className="rounded bg-[var(--paper)] px-1 text-xs">
					firstname,lastname,email
				</code>
				. Duplicate emails will be skipped.
			</p>
			<div className="flex flex-wrap items-end gap-3">
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					CSV file
					<Input
						type="file"
						accept=".csv"
						className="h-11"
						onChange={(e) =>
							setFile(e.target.files?.[0] ?? null)
						}
					/>
				</label>
				<Button
					disabled={!file || uploading}
					onClick={handleUpload}
					className="h-11"
				>
					{uploading ? 'Importing…' : 'Upload and import'}
				</Button>
			</div>
			{error && (
				<p className="mt-3 text-sm font-semibold text-[var(--sumac)]">
					{error}
				</p>
			)}
			{result && (
				<div className="mt-3 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
					<strong>{result.imported}</strong> contacts imported,{' '}
					<strong>{result.skipped}</strong> skipped (duplicates or
					invalid rows).
					<button
						type="button"
						className="ml-3 font-semibold underline"
						onClick={onImported}
					>
						Refresh list
					</button>
				</div>
			)}
		</section>
	)
}
