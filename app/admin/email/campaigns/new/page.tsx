import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { CampaignForm } from '@/app/admin/email/campaigns/campaign-form'

export const metadata: Metadata = { title: 'New Email Campaign' }
export const runtime = 'nodejs'

export default function NewCampaignPage() {
	return <AdminShell title="New campaign" description="Select a template and group to send an email campaign."><CampaignForm /></AdminShell>
}
