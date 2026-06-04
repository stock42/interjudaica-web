import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { CampaignForm } from '@/app/admin/crm/campaigns/campaign-form'

export const metadata: Metadata = {
	title: 'New Campaign — CRM',
	description: 'Create a new CRM campaign.',
}

export const runtime = 'nodejs'

export default function NewCampaignPage() {
	return (
		<AdminShell
			title="New campaign"
			description="Create a new campaign to organize your contacts."
		>
			<CampaignForm />
		</AdminShell>
	)
}
