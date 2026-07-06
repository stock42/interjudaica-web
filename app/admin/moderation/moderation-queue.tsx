'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { adminTextControlClass } from '@/app/admin/components/admin-controls'
import { Button } from '@/components/ui/button'
import type { TypeSafeOperator } from '@/models/operators'

export type ModerationQueueItem = {
	readonly uuid: string
	readonly kind: 'contact' | 'forum'
	readonly title: string
	readonly subtitle: string
	readonly status: string
	readonly ownerOperatorUuid: string
	readonly dueAt: string
	readonly href: string
}

function isOverdue(value: string): boolean {
	if (!value) {
		return false
	}

	const dueAt = new Date(value).getTime()
	return Number.isFinite(dueAt) && dueAt < Date.now()
}

export function ModerationQueue({
	initialItems,
	operators,
}: {
	initialItems: ModerationQueueItem[]
	operators: TypeSafeOperator[]
}) {
	const [items, setItems] = useState(initialItems)
	const [status, setStatus] = useState('all')
	const [owner, setOwner] = useState('all')
	const [due, setDue] = useState('all')
	const [savingUuid, setSavingUuid] = useState('')
	const [error, setError] = useState('')

	const filteredItems = useMemo(
		() =>
			items.filter(item => {
				const matchesStatus = status === 'all' || item.status === status
				const matchesOwner =
					owner === 'all' ||
					(owner === 'unassigned' && !item.ownerOperatorUuid) ||
					item.ownerOperatorUuid === owner
				const matchesDue =
					due === 'all' ||
					(due === 'overdue' && isOverdue(item.dueAt)) ||
					(due === 'none' && !item.dueAt)

				return matchesStatus && matchesOwner && matchesDue
			}),
		[due, items, owner, status],
	)

	async function saveItem(
		item: ModerationQueueItem,
		update: Partial<ModerationQueueItem>,
	) {
		setSavingUuid(item.uuid)
		setError('')

		const response = await fetch(`/api/admin/moderation/${item.kind}/${item.uuid}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update),
		})
		setSavingUuid('')

		if (!response.ok) {
			setError('Moderation item could not be saved.')
			return
		}

		setItems(current =>
			current.map(currentItem =>
				currentItem.uuid === item.uuid ? { ...currentItem, ...update } : currentItem,
			),
		)
	}

	return (
		<div className="grid gap-5">
			<section className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-3 sm:p-5">
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Status
					<select
						className={adminTextControlClass}
						value={status}
						onChange={event => setStatus(event.target.value)}
					>
						<option value="all">All</option>
						<option value="new">New contact</option>
						<option value="replied">Replied contact</option>
						<option value="open">Open thread</option>
						<option value="closed">Closed thread</option>
						<option value="hidden">Hidden thread</option>
					</select>
				</label>
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Owner
					<select
						className={adminTextControlClass}
						value={owner}
						onChange={event => setOwner(event.target.value)}
					>
						<option value="all">All</option>
						<option value="unassigned">Unassigned</option>
						{operators.map(operator => (
							<option
								key={operator.uuid}
								value={operator.uuid}
							>
								{operator.email}
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Due date
					<select
						className={adminTextControlClass}
						value={due}
						onChange={event => setDue(event.target.value)}
					>
						<option value="all">All</option>
						<option value="overdue">Overdue</option>
						<option value="none">No due date</option>
					</select>
				</label>
			</section>

			{error ?
				<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</p>
			:	null}

			<section className="grid gap-3">
				{filteredItems.length ?
					filteredItems.map(item => (
						<article
							key={`${item.kind}-${item.uuid}`}
							className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 md:grid-cols-[1fr_auto] md:items-center"
						>
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
									{item.kind === 'contact' ? 'Contact' : 'Forum'}
								</p>
								<h2 className="mt-2 text-base font-semibold text-[var(--ink)]">
									{item.title}
								</h2>
								<p className="mt-1 text-sm text-[var(--muted)]">{item.subtitle}</p>
							</div>
							<div className="grid gap-2 sm:grid-cols-[9rem_13rem_11rem_auto]">
								<select
									className={adminTextControlClass}
									value={item.status}
									onChange={event => saveItem(item, { status: event.target.value })}
								>
									{item.kind === 'contact' ?
										<>
											<option value="new">New</option>
											<option value="replied">Replied</option>
										</>
									:	<>
											<option value="open">Open</option>
											<option value="closed">Closed</option>
											<option value="hidden">Hidden</option>
										</>
									}
								</select>
								<select
									className={adminTextControlClass}
									value={item.ownerOperatorUuid}
									onChange={event =>
										saveItem(item, { ownerOperatorUuid: event.target.value })
									}
								>
									<option value="">Unassigned</option>
									{operators.map(operator => (
										<option
											key={operator.uuid}
											value={operator.uuid}
										>
											{operator.email}
										</option>
									))}
								</select>
								<input
									className={adminTextControlClass}
									type="date"
									value={item.dueAt.slice(0, 10)}
									onChange={event => saveItem(item, { dueAt: event.target.value })}
								/>
								<Button
									asChild
									variant="outline"
									disabled={savingUuid === item.uuid}
								>
									<Link href={item.href}>Open</Link>
								</Button>
							</div>
						</article>
					))
				:	<p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
						No moderation items match this filter.
					</p>
				}
			</section>
		</div>
	)
}
