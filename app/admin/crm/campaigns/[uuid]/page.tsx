import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/app/components/portal-ui'
import { CampaignForm } from '@/app/admin/crm/campaigns/campaign-form'
import { CampaignContacts } from '@/app/admin/crm/campaigns/[uuid]/campaign-contacts'
import { CrmCampaignStorage } from '@/services/crm-campaigns-storage'

export const metadata: Metadata = {
	title: 'Edit Campaign — CRM',
	description: 'Edit a CRM campaign and manage its contacts.',
}

export const runtime = 'nodejs'

export default async function EditCampaignPage({
	params,
}: {
	params: Promise<{ uuid: string }>
}) {
	const { uuid } = await params
	const campaign = await CrmCampaignStorage.get(uuid)

	if (!campaign) {
		notFound()
	}

	return (
		<AdminShell
			title="Edit campaign"
			description="Update campaign details and manage assigned contacts."
		>
			<div className="grid gap-8">
				<CampaignForm campaign={campaign} />
				<CampaignContacts campaignUuid={uuid} />
			</div>
		</AdminShell>
	)
}
