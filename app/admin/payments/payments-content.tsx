'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { adminTextControlClass } from '@/app/admin/components/admin-controls'
import { PaymentDetailModal } from '@/app/admin/components/payment-detail-modal'
import { CSVExportButton } from '@/app/admin/components/csv-export-button'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from '@/components/ui/pagination'

type PaymentType = 'course' | 'book' | 'subscription'

interface PaymentItem {
	id: string
	type: PaymentType
	status: string
	amount: number
	currency: string
	user: { name: string; email: string }
	item: string
	date: string
	stripeSessionId: string
	stripePaymentIntentId: string
}

interface PaymentsResponse {
	items: PaymentItem[]
	page: number
	totalPages: number
	totalItems: number
}

const LIMIT = 30

function formatDate(value: string) {
	if (!value) return '-'
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) return value
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

const TYPE_LABEL: Record<PaymentType, string> = {
	course: 'Course',
	book: 'Book',
	subscription: 'Subscription',
}

function getPaginationRange(
	current: number,
	total: number,
): (number | 'ellipsis')[] {
	if (total <= 1) return []
	const range: (number | 'ellipsis')[] = []
	const delta = 2
	const left = Math.max(2, current - delta)
	const right = Math.min(total - 1, current + delta)

	range.push(1)
	if (left > 2) range.push('ellipsis')
	for (let i = left; i <= right; i++) range.push(i)
	if (right < total - 1) range.push('ellipsis')
	if (total > 1) range.push(total)

	return range
}

const csvColumns = [
	{ key: 'id' as const, label: 'Payment ID' },
	{ key: 'type' as const, label: 'Type' },
	{ key: 'status' as const, label: 'Status' },
	{ key: 'amount' as const, label: 'Amount' },
	{ key: 'currency' as const, label: 'Currency' },
	{ key: 'username' as const, label: 'User Name' },
	{ key: 'useremail' as const, label: 'User Email' },
	{ key: 'item' as const, label: 'Item' },
	{ key: 'date' as const, label: 'Date' },
	{ key: 'stripeSessionId' as const, label: 'Stripe Session ID' },
	{ key: 'stripePaymentIntentId' as const, label: 'Stripe Payment Intent ID' },
]

function statusBadgeClass(status: string) {
	switch (status) {
		case 'paid':
			return 'bg-emerald-100 text-emerald-800 border-emerald-200'
		case 'pending':
			return 'bg-amber-100 text-amber-800 border-amber-200'
		case 'failed':
			return 'bg-red-100 text-red-800 border-red-200'
		case 'refunded':
			return 'bg-slate-100 text-slate-600 border-slate-200'
		default:
			return 'bg-slate-100 text-slate-600 border-slate-200'
	}
}

export function PaymentsContent({
	search: initialSearch,
	type: initialType,
	page: initialPage,
}: {
	search: string
	type: string
	page: number
}) {
	const router = useRouter()
	const [data, setData] = useState<PaymentsResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null)
	const [modalOpen, setModalOpen] = useState(false)

	const [searchInput, setSearchInput] = useState(initialSearch)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

	function buildUrl(
		updates: Partial<{ search: string; type: string; page: number }>,
	) {
		const s =
			updates.search !== undefined ? updates.search : initialSearch
		const t = updates.type !== undefined ? updates.type : initialType
		const p = updates.page !== undefined ? updates.page : initialPage
		const params = new URLSearchParams()
		if (s) params.set('search', s)
		if (t) params.set('type', t)
		if (p > 1) params.set('page', String(p))
		return `/admin/payments${params.toString() ? `?${params}` : ''}`
	}

	useEffect(() => {
		let cancelled = false
		async function fetchData() {
			setLoading(true)
			setError(null)
			const params = new URLSearchParams()
			if (initialSearch) params.set('search', initialSearch)
			if (initialType) params.set('type', initialType)
			params.set('page', String(initialPage))
			params.set('limit', String(LIMIT))

			try {
				const res = await fetch(`/api/admin/payments?${params}`)
				if (!cancelled) {
					if (!res.ok) {
						setError('Failed to load payments')
						setLoading(false)
						return
					}
					const json = await res.json()
					setData(json)
					setLoading(false)
				}
			} catch {
				if (!cancelled) {
					setError('Failed to load payments')
					setLoading(false)
				}
			}
		}
		fetchData()
		return () => {
			cancelled = true
		}
	}, [initialSearch, initialType, initialPage])

	function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (debounceRef.current) clearTimeout(debounceRef.current)
		router.push(buildUrl({ search: searchInput, page: 1 }))
	}

	function handleSearchChange(value: string) {
		setSearchInput(value)
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			router.push(buildUrl({ search: value, page: 1 }))
		}, 400)
	}

	function handleTypeChange(value: string) {
		router.push(buildUrl({ type: value, page: 1 }))
	}

	function handleRowClick(payment: PaymentItem) {
		setSelectedPayment(payment)
		setModalOpen(true)
	}

	const csvExportData =
		data?.items.map((p) => ({
			id: p.id,
			type: p.type,
			status: p.status,
			amount: p.amount.toFixed(2),
			currency: p.currency,
			username: p.user.name,
			useremail: p.user.email,
			item: p.item,
			date: p.date,
			stripeSessionId: p.stripeSessionId,
			stripePaymentIntentId: p.stripePaymentIntentId,
		})) ?? []

	const pageRange = getPaginationRange(initialPage, data?.totalPages ?? 1)

	return (
		<div className="grid gap-5">
			{/* Filters */}
			<section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:p-5">
				<form
					onSubmit={handleSearchSubmit}
					className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
				>
					<label className="grid flex-1 gap-2 text-sm font-semibold text-[var(--ink)]">
						Search payments
						<Input
							className={adminTextControlClass}
							type="search"
							placeholder="User name, email, or item"
							value={searchInput}
							onChange={(e) => handleSearchChange(e.target.value)}
						/>
					</label>
					<label className="grid w-full gap-2 text-sm font-semibold text-[var(--ink)] xl:w-56">
						Type
						<select
							className={adminTextControlClass}
							value={initialType}
							onChange={(e) => handleTypeChange(e.target.value)}
						>
							<option value="">All types</option>
							<option value="course">Courses</option>
							<option value="book">Books</option>
							<option value="subscription">Subscriptions</option>
						</select>
					</label>
					<CSVExportButton
						data={csvExportData}
						columns={csvColumns}
						filename="interjudaica-payments"
					/>
				</form>
				{data && (
					<p className="mt-3 text-xs text-[var(--muted)]">
						{data.totalItems} payment{data.totalItems !== 1 ? 's' : ''}{' '}
						found
						{data.totalItems > LIMIT &&
							` (page ${data.page} of ${data.totalPages})`}
					</p>
				)}
			</section>

			{/* Table */}
			{error ? (
				<div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-[var(--muted)] shadow-[var(--shadow)]">
					{error}
				</div>
			) : loading ? (
				<div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)] shadow-[var(--shadow)]">
					Loading payments&hellip;
				</div>
			) : (data?.items.length ?? 0) === 0 ? (
				<div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)] shadow-[var(--shadow)]">
					No payments match this filter.
				</div>
			) : (
				<>
					<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
						<div className="overflow-x-auto">
							<table className="w-full min-w-[56rem] border-collapse text-left text-sm">
								<thead className="bg-[rgba(244,189,51,0.08)] text-xs uppercase tracking-[0.12em] text-[var(--gold)]">
									<tr>
										<th className="px-4 py-3 font-bold">Payment</th>
										<th className="px-4 py-3 font-bold">User</th>
										<th className="px-4 py-3 font-bold">Type</th>
										<th className="px-4 py-3 font-bold">Amount</th>
										<th className="px-4 py-3 font-bold">Status</th>
										<th className="px-4 py-3 font-bold">Date</th>
									</tr>
								</thead>
								<tbody>
									{data?.items.map((p) => (
										<tr
											key={p.id}
											className="border-t border-[var(--line)] cursor-pointer transition-colors hover:bg-[rgba(244,189,51,0.08)]"
											onClick={() => handleRowClick(p)}
											tabIndex={0}
											role="button"
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault()
													handleRowClick(p)
												}
											}}
										>
											<td className="px-4 py-4">
												<p className="font-mono text-xs text-[var(--muted)]">
													{p.stripeSessionId
														? p.stripeSessionId.slice(-12)
														: p.stripePaymentIntentId
															? p.stripePaymentIntentId.slice(-12)
															: '—'}
												</p>
												<p className="mt-1 text-xs text-[var(--muted)]">
													{p.item}
												</p>
											</td>
											<td className="px-4 py-4">
												<p className="font-semibold text-[var(--ink)]">
													{p.user.name || p.user.email}
												</p>
												<p className="mt-1 text-xs text-[var(--muted)]">
													{p.user.email}
												</p>
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{TYPE_LABEL[p.type] ?? p.type}
											</td>
											<td className="px-4 py-4 font-semibold tabular-nums text-[var(--ink)]">
												${(p.amount ?? 0).toFixed(2)}{' '}
												<span className="text-xs font-normal uppercase text-[var(--muted)]">
													{p.currency}
												</span>
											</td>
											<td className="px-4 py-4">
												<span
													className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(p.status)}`}
												>
													{p.status}
												</span>
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{formatDate(p.date)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>

					{data && data.totalPages > 1 && (
						<Pagination>
							<PaginationContent>
								{initialPage > 1 ? (
									<PaginationItem>
										<PaginationPrevious
											href={buildUrl({
												page: initialPage - 1,
											})}
										/>
									</PaginationItem>
								) : (
									<PaginationItem>
										<PaginationPrevious
											aria-disabled
											href="#"
										/>
									</PaginationItem>
								)}

								{pageRange.map((item, i) => (
									<PaginationItem key={i}>
										{item === 'ellipsis' ? (
											<PaginationEllipsis />
										) : (
											<PaginationLink
												href={buildUrl({
													page: item,
												})}
												isActive={item === initialPage}
											>
												{item}
											</PaginationLink>
										)}
									</PaginationItem>
								))}

								{initialPage < data.totalPages ? (
									<PaginationItem>
										<PaginationNext
											href={buildUrl({
												page: initialPage + 1,
											})}
										/>
									</PaginationItem>
								) : (
									<PaginationItem>
										<PaginationNext
											aria-disabled
											href="#"
										/>
									</PaginationItem>
								)}
							</PaginationContent>
						</Pagination>
					)}
				</>
			)}
			<PaymentDetailModal
				payment={selectedPayment}
				open={modalOpen}
				onOpenChange={setModalOpen}
			/>
		</div>
	)
}
