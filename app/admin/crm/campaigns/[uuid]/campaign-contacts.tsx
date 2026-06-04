'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TypeCrmContact } from '@/models/crm-contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminTextControlClass } from '@/app/admin/components/admin-controls'

type AssignedContact = {
	campaignContactUuid: string
	contact: TypeCrmContact
	status: string
}

export function CampaignContacts({
	campaignUuid,
}: {
	campaignUuid: string
}) {
	const [assigned, setAssigned] = useState<AssignedContact[]>([])
	const [loading, setLoading] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<TypeCrmContact[]>([])
	const [searching, setSearching] = useState(false)
	const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set())
	const [newStatus, setNewStatus] = useState('')
	const [assigning, setAssigning] = useState(false)
	const [feedback, setFeedback] = useState('')

	const [editingStatus, setEditingStatus] = useState<Record<string, string>>({})
	const [savingStatus, setSavingStatus] = useState<Set<string>>(new Set())

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const adminLoginUrl = `/operator-login?next=/admin/crm/campaigns/${encodeURIComponent(campaignUuid)}`

	const fetchAssigned = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch(
				`/api/admin/crm/campaigns/${encodeURIComponent(campaignUuid)}/contacts`,
			)
			if (res.status === 401) {
				window.location.assign(adminLoginUrl)
				return
			}
			const data = await res.json()
			const items: AssignedContact[] = data.items ?? []
			setAssigned(items)
			const init: Record<string, string> = {}
			for (const item of items) {
				if (item.contact?.uuid) {
					init[item.contact.uuid] = item.status ?? ''
				}
			}
			setEditingStatus(init)
		} finally {
			setLoading(false)
		}
	}, [campaignUuid, adminLoginUrl])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchAssigned()
	}, [fetchAssigned])

	useEffect(() => {
		if (!searchQuery.trim()) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSearchResults([])
			return
		}

		if (debounceRef.current) {
			clearTimeout(debounceRef.current)
		}

		debounceRef.current = setTimeout(async () => {
			setSearching(true)
			try {
				const res = await fetch(
					`/api/admin/crm/contacts?q=${encodeURIComponent(searchQuery.trim())}&limit=15`,
				)
				if (res.status === 401) {
					window.location.assign(adminLoginUrl)
					return
				}
				if (!res.ok) {
					setSearchResults([])
					return
				}
				const data = await res.json()
				const assignedUuids = new Set(
					assigned.map((a) => a.contact?.uuid).filter(Boolean),
				)
				setSearchResults(
					(data.items ?? []).filter(
						(c: TypeCrmContact) =>
							c.uuid && !assignedUuids.has(c.uuid),
					),
				)
			} finally {
				setSearching(false)
			}
		}, 300)

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current)
			}
		}
	}, [searchQuery, assigned, adminLoginUrl])

	function toggleSelect(uuid: string) {
		setSelectedUuids((prev) => {
			const next = new Set(prev)
			if (next.has(uuid)) {
				next.delete(uuid)
			} else {
				next.add(uuid)
			}
			return next
		})
	}

	function toggleSelectAll() {
		const allUuids = searchResults
			.map((c) => c.uuid)
			.filter((u): u is string => !!u)
		const allSelected = allUuids.every((u) => selectedUuids.has(u))
		if (allSelected) {
			setSelectedUuids(new Set())
		} else {
			setSelectedUuids(new Set(allUuids))
		}
	}

	async function handleAssign() {
		if (selectedUuids.size === 0) return
		setAssigning(true)
		setFeedback('')
		try {
			const res = await fetch(
				`/api/admin/crm/campaigns/${encodeURIComponent(campaignUuid)}/contacts`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contactUuids: Array.from(selectedUuids),
						status: newStatus,
					}),
				},
			)
			if (res.status === 401) {
				window.location.assign(adminLoginUrl)
				return
			}
			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				setFeedback(data.error ?? 'Failed to assign contacts.')
				return
			}
			const assignedCount = data.assigned ?? 0
			const skippedCount = data.skipped ?? 0
			setFeedback(
				`${assignedCount} assigned, ${skippedCount} skipped (already assigned)`,
			)
			setSelectedUuids(new Set())
			setNewStatus('')
			setSearchQuery('')
			setSearchResults([])
			fetchAssigned()
		} finally {
			setAssigning(false)
		}
	}

	async function handleUpdateStatus(contactUuid: string) {
		const newVal = editingStatus[contactUuid] ?? ''
		setSavingStatus((prev) => new Set(prev).add(contactUuid))
		try {
			const res = await fetch(
				`/api/admin/crm/campaigns/${encodeURIComponent(campaignUuid)}/contacts/${encodeURIComponent(contactUuid)}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ status: newVal }),
				},
			)
			if (res.status === 401) {
				window.location.assign(adminLoginUrl)
				return
			}
			if (!res.ok) return
			setAssigned((prev) =>
				prev.map((a) =>
					a.contact?.uuid === contactUuid
						? { ...a, status: newVal }
						: a,
				),
			)
		} finally {
			setSavingStatus((prev) => {
				const next = new Set(prev)
				next.delete(contactUuid)
				return next
			})
		}
	}

	async function handleUnassign(contactUuid: string) {
		if (
			!window.confirm('Remove this contact from the campaign?')
		)
			return
		const res = await fetch(
			`/api/admin/crm/campaigns/${encodeURIComponent(campaignUuid)}/contacts/${encodeURIComponent(contactUuid)}`,
			{ method: 'DELETE' },
		)
		if (res.status === 401) {
			window.location.assign(adminLoginUrl)
			return
		}
		if (res.ok) {
			setAssigned((prev) =>
				prev.filter((a) => a.contact?.uuid !== contactUuid),
			)
			setEditingStatus((prev) => {
				const next = { ...prev }
				delete next[contactUuid]
				return next
			})
		} else {
			window.alert('Could not remove contact.')
		}
	}

	const allSelectableUuids = searchResults
		.map((c) => c.uuid)
		.filter((u): u is string => !!u)
	const allSelected =
		allSelectableUuids.length > 0 &&
		allSelectableUuids.every((u) => selectedUuids.has(u))

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
			{/* Left panel: Assigned Contacts */}
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<h3 className="text-lg font-semibold text-[var(--ink)]">
					Assigned Contacts
				</h3>
				<p className="mb-4 text-sm text-[var(--muted)]">
					{loading
						? 'Loading…'
						: `${assigned.length} contact${assigned.length !== 1 ? 's' : ''} assigned`}
				</p>

				{loading ? (
					<p className="py-4 text-sm text-[var(--muted)]">
						Loading…
					</p>
				) : assigned.length === 0 ? (
					<p className="py-8 text-center text-sm text-[var(--muted)]">
						No contacts assigned to this campaign
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[30rem] border-collapse text-left text-sm">
							<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
								<tr>
									<th className="px-4 py-3 font-bold">
										Name
									</th>
									<th className="px-4 py-3 font-bold">
										Email
									</th>
									<th className="px-4 py-3 font-bold">
										Status
									</th>
									<th className="px-4 py-3 font-bold">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{assigned.map((a) => {
									const contactUuid =
										a.contact?.uuid ?? ''
									return (
										<tr
											key={
												a.campaignContactUuid
											}
											className="border-t border-[var(--line)] align-middle"
										>
											<td className="px-4 py-4 font-semibold text-[var(--ink)]">
												{a.contact
													?.firstname ??
													'—'}{' '}
												{a.contact
													?.lastname ??
													''}
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{a.contact
													?.email ??
													'—'}
											</td>
											<td className="px-4 py-4">
												<Input
													className="h-9 w-36 text-sm"
													value={
														editingStatus[
															contactUuid
														] ??
														''
													}
													disabled={
														savingStatus.has(
															contactUuid,
														)
													}
													onChange={(
														e,
													) =>
														setEditingStatus(
															(
																prev,
															) => ({
																...prev,
																[contactUuid]:
																	e
																		.target
																		.value,
															}),
														)
													}
													onBlur={												() => {
													if (contactUuid) {
														handleUpdateStatus(
															contactUuid,
														)
													}
												}
													}
													onKeyDown={(
														e,
													) => {
														if (
															e.key ===
															'Enter'
														) {
															e.preventDefault()
															if (contactUuid) {
																handleUpdateStatus(
																	contactUuid,
																)
															}
														}
													}}
												/>
											</td>
											<td className="px-4 py-4">
												<button
													type="button"
													className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
													onClick={() => {
														if (contactUuid) {
															handleUnassign(
																contactUuid,
															)
														}
													}}
												>
													Unassign
												</button>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{/* Right panel: Add Contacts */}
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<h3 className="text-lg font-semibold text-[var(--ink)]">
					Add Contacts
				</h3>
				<p className="mb-4 text-sm text-[var(--muted)]">
					Search and select contacts to assign to this campaign.
				</p>

				<div className="grid gap-4">
					<Label
						htmlFor="campaign-contact-search"
						className="grid gap-2 text-sm font-semibold text-[var(--ink)]"
					>
						Search contacts
						<Input
							id="campaign-contact-search"
							className={adminTextControlClass}
							type="search"
							placeholder="Name or email…"
							value={searchQuery}
							onChange={(e) =>
								setSearchQuery(e.target.value)
							}
						/>
					</Label>

					{searching && (
						<p className="text-xs text-[var(--muted)]">
							Searching…
						</p>
					)}

					{!searching &&
						searchQuery.trim() &&
						searchResults.length === 0 && (
							<p className="text-sm text-[var(--muted)]">
								No contacts found.
							</p>
						)}

					{searchResults.length > 0 && (
						<div className="max-h-64 space-y-0 overflow-y-auto rounded-md border border-[var(--line)] bg-[var(--paper)]">
							<div className="sticky top-0 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2">
								<input
									type="checkbox"
									className="h-4 w-4 rounded accent-[var(--sapphire)]"
									checked={allSelected}
									onChange={toggleSelectAll}
								/>
								<span className="text-xs font-semibold text-[var(--muted)]">
									Select all
								</span>
							</div>
							{searchResults.map((c) => {
								const isSelected = c.uuid
									? selectedUuids.has(c.uuid)
									: false
								return (
									<label
										key={c.uuid}
										className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-white ${isSelected ? 'bg-white' : ''}`}
									>
										<input
											type="checkbox"
											className="h-4 w-4 rounded accent-[var(--sapphire)]"
											checked={isSelected}
											onChange={() =>
												c.uuid &&
												toggleSelect(
													c.uuid,
												)
											}
										/>
										<span className="font-medium text-[var(--ink)]">
											{c.firstname}{' '}
											{c.lastname}
										</span>
										<span className="ml-auto text-xs text-[var(--muted)]">
											{c.email}
										</span>
									</label>
								)
							})}
						</div>
					)}

					{selectedUuids.size > 0 && (
						<div className="grid gap-3 rounded-md border border-[var(--line)] bg-[var(--paper)] p-4">
							<p className="text-sm font-semibold text-[var(--ink)]">
								{selectedUuids.size} contact
								{selectedUuids.size !== 1
									? 's'
									: ''}{' '}
								selected
							</p>
							<div className="grid gap-2">
								<Label
									htmlFor="assign-status-input"
									className="text-xs text-[var(--muted)]"
								>
									Initial status (optional)
								</Label>
								<Input
									id="assign-status-input"
									className="h-9 text-sm"
									placeholder='e.g. "Pending", "Contacted"'
									value={newStatus}
									onChange={(e) =>
										setNewStatus(
											e.target.value,
										)
									}
								/>
							</div>
							<Button
								size="sm"
								className="h-9"
								disabled={assigning}
								onClick={handleAssign}
							>
								{assigning
									? 'Assigning…'
									: 'Assign Selected'}
							</Button>
						</div>
					)}

					{feedback && (
						<p className="rounded-md bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
							{feedback}
						</p>
					)}
				</div>
			</section>
		</div>
	)
}
