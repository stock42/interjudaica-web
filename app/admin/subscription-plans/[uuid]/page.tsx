import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SubscriptionPlanForm } from '@/app/admin/subscription-plans/subscription-plan-form'
import { AdminShell } from '@/app/components/portal-ui'
import { SubscriptionPlanStorage } from '@/services/subscription-plans-storage'

export const metadata: Metadata = {
	title: 'Edit Subscription Plan',
	description: 'Edit a subscription plan.',
}

export const runtime = 'nodejs'

export default async function EditSubscriptionPlanPage({
	params,
}: {
	params: Promise<{ uuid: string }>
}) {
	const { uuid } = await params
	const plan = await SubscriptionPlanStorage.get(uuid)

	if (!plan) {
		notFound()
	}

	return (
		<AdminShell
			title="Edit plan"
			description="Update plan name, price, billing interval, and active status."
		>
			<SubscriptionPlanForm plan={plan} />
		</AdminShell>
	)
}
