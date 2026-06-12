import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { PaymentsContent } from '@/app/admin/payments/payments-content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Admin Payments',
	description: 'Track course purchases, book sales, and community subscriptions.',
}

export default async function AdminPaymentsPage({
	searchParams,
}: {
	searchParams: Promise<{ search?: string; type?: string; page?: string }>
}) {
	const params = await searchParams

	return (
		<AdminShell
			title="Payments"
			description="Track course purchases, book sales, community subscriptions, and reconciliation notes."
		>
			<PaymentsContent
				search={params.search ?? ''}
				type={params.type ?? ''}
				page={Number(params.page) || 1}
			/>
		</AdminShell>
	)
}
