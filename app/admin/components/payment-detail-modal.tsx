'use client'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type PaymentType = 'course' | 'book' | 'subscription'

interface UnifiedPayment {
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

const typeLabels: Record<PaymentType, string> = {
	course: 'Course Purchase',
	book: 'Book Sale',
	subscription: 'Community Subscription',
}

function statusVariant(status: string) {
	switch (status) {
		case 'paid':
			return 'default'
		case 'pending':
			return 'secondary'
		case 'failed':
			return 'destructive'
		case 'refunded':
			return 'outline'
		default:
			return 'secondary'
	}
}

function formatDate(value: string) {
	if (!value) return '-'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return value
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-4 py-2">
			<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{label}
			</span>
			<span className="text-sm text-foreground text-right break-all">{value}</span>
		</div>
	)
}

interface PaymentDetailModalProps {
	payment: UnifiedPayment | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function PaymentDetailModal({
	payment,
	open,
	onOpenChange,
}: PaymentDetailModalProps) {
	if (!payment) return null

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Payment Details</DialogTitle>
					<DialogDescription>
						{typeLabels[payment.type]} &middot;{' '}
						{payment.date ? formatDate(payment.date) : 'No date'}
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-3">
					<Badge variant={statusVariant(payment.status)}>
						{payment.status}
					</Badge>
					<Badge variant="outline">{payment.type}</Badge>
					<span className="ml-auto text-lg font-semibold tabular-nums">
						${payment.amount.toFixed(2)}{' '}
						<span className="text-xs font-normal uppercase text-muted-foreground">
							{payment.currency}
						</span>
					</span>
				</div>

				<Separator />

				<div className="flex flex-col gap-1">
					<DetailRow label="Payment ID" value={payment.id} />
					<DetailRow label="User" value={payment.user.name || payment.user.email} />
					<DetailRow label="Email" value={payment.user.email} />
					<DetailRow label="Item" value={payment.item} />
					<DetailRow label="Date" value={formatDate(payment.date)} />
					<DetailRow label="Stripe Session ID" value={payment.stripeSessionId || '-'} />
					<DetailRow
						label="Stripe Payment Intent"
						value={payment.stripePaymentIntentId || '-'}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
