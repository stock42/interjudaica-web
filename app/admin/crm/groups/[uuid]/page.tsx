import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/app/components/portal-ui'
import { GroupForm } from '@/app/admin/crm/groups/group-form'
import { RunGroupPreview } from '@/app/admin/crm/groups/run-group-preview'
import { CrmGroupStorage } from '@/services/crm-groups-storage'

export const metadata: Metadata = { title: 'Edit CRM Group' }
export const runtime = 'nodejs'

export default async function EditGroupPage({ params }: { params: Promise<{ uuid: string }> }) {
	const { uuid } = await params
	const group = await CrmGroupStorage.get(uuid)
	if (!group) notFound()
	return (
		<AdminShell title="Edit group" description="Modify the target segment and MongoDB query.">
			<GroupForm group={group} />
			<RunGroupPreview groupUuid={group.uuid!} />
		</AdminShell>
	)
}
