'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { adminTextControlClass } from '@/app/admin/components/admin-controls'
import { Input } from '@/components/ui/input'

export type UserAccessRow = {
	readonly uuid: string
	readonly name: string
	readonly email: string
	readonly location: string
	readonly status: string
	readonly communityStatus: string
	readonly enrolledCourses: string[]
	readonly paymentSources: string[]
	readonly lastAccessAt: string
}

function formatDate(value: string): string {
	if (!value) {
		return 'No activity'
	}

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return value
	}

	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

export function UserAccessList({ rows }: { rows: UserAccessRow[] }) {
	const [query, setQuery] = useState('')
	const [status, setStatus] = useState('all')
	const normalizedQuery = query.trim().toLowerCase()

	const filteredRows = useMemo(
		() =>
			rows.filter(row => {
				const matchesQuery =
					!normalizedQuery ||
					[
						row.name,
						row.email,
						row.location,
						row.enrolledCourses.join(' '),
						row.paymentSources.join(' '),
					]
						.join(' ')
						.toLowerCase()
						.includes(normalizedQuery)
				const matchesStatus = status === 'all' || row.status === status

				return matchesQuery && matchesStatus
			}),
		[normalizedQuery, rows, status],
	)

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
				<div className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem]">
					<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
						Search access
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
							<Input
								className={`${adminTextControlClass} pl-9`}
								type="search"
								placeholder="Name, email, course, payment source"
								value={query}
								onChange={event => setQuery(event.target.value)}
							/>
						</div>
					</label>
					<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
						Status
						<select
							className={adminTextControlClass}
							value={status}
							onChange={event => setStatus(event.target.value)}
						>
							<option value="all">All</option>
							<option value="active">Active</option>
							<option value="pending">Pending</option>
							<option value="disabled">Disabled</option>
						</select>
					</label>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[64rem] border-collapse text-left text-sm">
						<thead className="bg-[rgba(244,189,51,0.08)] text-xs uppercase tracking-[0.12em] text-[var(--gold)]">
							<tr>
								<th className="px-4 py-3 font-bold">Student</th>
								<th className="px-4 py-3 font-bold">Access</th>
								<th className="px-4 py-3 font-bold">Payment source</th>
								<th className="px-4 py-3 font-bold">Last access</th>
								<th className="px-4 py-3 font-bold">Action</th>
							</tr>
						</thead>
						<tbody>
							{filteredRows.length ?
								filteredRows.map(row => (
									<tr
										key={row.uuid}
										className="border-t border-[var(--line)] align-top hover:bg-[rgba(244,189,51,0.05)]"
									>
										<td className="px-4 py-4">
											<p className="font-semibold text-[var(--ink)]">
												{row.name || row.email}
											</p>
											<p className="mt-1 text-xs text-[var(--muted)]">{row.email}</p>
											<p className="mt-1 text-xs text-[var(--muted)]">
												{row.location || 'Location not set'}
											</p>
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											<p>{row.enrolledCourses.length} course enrollments</p>
											<p className="mt-1">Community: {row.communityStatus}</p>
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{row.paymentSources.length ?
												row.paymentSources.join(', ')
											:	'No payment source'}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{formatDate(row.lastAccessAt)}
										</td>
										<td className="px-4 py-4">
											<Link
												href={`/admin/users/${row.uuid}`}
												className="inline-flex min-h-9 items-center rounded-md border border-[var(--line)] px-3 text-xs font-bold text-[var(--gold)] transition hover:bg-[rgba(244,189,51,0.1)]"
											>
												Diagnostics
											</Link>
										</td>
									</tr>
								))
							:	<tr>
									<td
										className="px-4 py-8 text-center text-sm text-[var(--muted)]"
										colSpan={5}
									>
										No users match this filter.
									</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	)
}
