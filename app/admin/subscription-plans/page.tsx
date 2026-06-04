import type { Metadata } from 'next'
import { SubscriptionPlansList } from '@/app/admin/subscription-plans/subscription-plans-list'
import { AdminShell } from '@/app/components/portal-ui'
import { SubscriptionPlanStorage } from '@/services/subscription-plans-storage'

export const metadata: Metadata = {
	title: 'Subscription Plans',
	description: 'Manage InterJudaica subscription plans.',
}

export const runtime = 'nodejs'

export default async function SubscriptionPlansPage() {
	const plans = await SubscriptionPlanStorage.list(true)

	return (
		<AdminShell
			title="Subscription plans"
			description="Create and manage community subscription plans. Each plan defines a name, price, and billing interval used for Stripe checkout."
		>
			<SubscriptionPlansList plans={plans} />
		</AdminShell>
	)
}
