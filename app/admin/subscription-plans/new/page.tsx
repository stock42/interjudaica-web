import type { Metadata } from 'next'
import { SubscriptionPlanForm } from '@/app/admin/subscription-plans/subscription-plan-form'
import { AdminShell } from '@/app/components/portal-ui'

export const metadata: Metadata = {
	title: 'New Subscription Plan',
	description: 'Create a new subscription plan.',
}

export const runtime = 'nodejs'

export default async function NewSubscriptionPlanPage() {
	return (
		<AdminShell
			title="New plan"
			description="Define a payment plan for the community checkout."
		>
			<SubscriptionPlanForm />
		</AdminShell>
	)
}
