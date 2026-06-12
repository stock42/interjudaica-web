'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TypeCrmContact } from '@/models/crm-contacts'

export function RunGroupPreview({ groupUuid }: { groupUuid: string }) {
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<{
		items: TypeCrmContact[]
		count: number
	} | null>(null)
	const [error, setError] = useState('')
	const [expanded, setExpanded] = useState(false)

	async function handleRun() {
		setLoading(true)
		setError('')
		setResult(null)
		try {
			const res = await fetch(
				`/api/admin/crm/groups/${groupUuid}/preview`,
			)
			const data = await res.json()
			if (!res.ok) {
				setError(data.error ?? 'Failed to preview group')
				return
			}
			setResult(data)
			setExpanded(true)
		} catch {
			setError('Network error while fetching preview')
		} finally {
			setLoading(false)
		}
	}

	return (
		<section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-display text-xl font-semibold">
					Run Preview
				</h2>
				<Button
					variant="outline"
					onClick={handleRun}
					disabled={loading}
				>
					{loading ? 'Running…' : '▶ Run'}
				</Button>
			</div>

			{error && (
				<p className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</p>
			)}

			{result !== null && (
				<div className="space-y-3">
					<div className="rounded-md bg-[var(--paper)] px-4 py-3">
						<p className="text-sm">
							<span className="font-semibold">
								{result.count}
							</span>{' '}
							contact{result.count !== 1 ? 's' : ''} matched
						</p>
					</div>

					{result.count > 0 && (
						<div>
							<button
								type="button"
								className="text-sm font-semibold text-[var(--sapphire)] hover:underline"
								onClick={() => setExpanded((v) => !v)}
							>
								{expanded ? '▲ Hide' : '▼ Show'} contacts
							</button>
							{expanded && (
								<div className="mt-2 max-h-96 overflow-x-auto overflow-y-auto rounded border border-[var(--line)]">
									<table className="min-w-full text-xs">
										<thead className="sticky top-0 bg-[var(--paper)]">
											<tr className="border-b border-[var(--line)] text-left">
												<th className="px-3 py-2 font-semibold">
													Name
												</th>
												<th className="px-3 py-2 font-semibold">
													Email
												</th>
											</tr>
										</thead>
										<tbody>
											{result.items.map(
												(contact, i) => (
													<tr
														key={
															contact.uuid ??
															i
														}
														className="border-b border-[var(--line)] last:border-0"
													>
														<td className="px-3 py-1.5">
															{
																contact.firstname
															}{' '}
															{
																contact.lastname
															}
														</td>
														<td className="px-3 py-1.5">
															{
																contact.email
															}
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</section>
	)
}
