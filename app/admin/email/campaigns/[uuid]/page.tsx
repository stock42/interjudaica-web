import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/app/components/portal-ui'
import { CampaignDetail } from '@/app/admin/email/campaigns/[uuid]/campaign-detail'
import { EmailCampaignStorage } from '@/services/email-campaigns-storage'

export const metadata: Metadata = { title: 'Campaign Detail' }
export const runtime = 'nodejs'

export default async function CampaignDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
	const { uuid } = await params
	const campaign = await EmailCampaignStorage.get(uuid)
	if (!campaign) notFound()
	const stats = await EmailCampaignStorage.getStats(uuid)
	return <AdminShell title={campaign.name} description={`Campaign status: ${campaign.status}`}><CampaignDetail campaign={{ ...campaign, stats }} /></AdminShell>
}
