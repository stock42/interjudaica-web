import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { CampaignsList } from '@/app/admin/email/campaigns/campaigns-list'

export const metadata: Metadata = { title: 'Email Campaigns' }
export const runtime = 'nodejs'

export default function CampaignsPage() {
	return <AdminShell title="Email Campaigns" description="Create and manage email marketing campaigns."><CampaignsList /></AdminShell>
}
