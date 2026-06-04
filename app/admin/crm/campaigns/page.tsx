import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { CampaignList } from '@/app/admin/crm/campaigns/campaign-list'

export const metadata: Metadata = {
	title: 'CRM — Campaigns',
	description: 'Manage email and outreach campaigns.',
}

export const runtime = 'nodejs'

export default function CrmCampaignsPage() {
	return (
		<AdminShell
			title="CRM — Campaigns"
			description="Create and manage campaigns. Assign contacts and track status."
		>
			<CampaignList />
		</AdminShell>
	)
}
