import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/app/components/portal-ui'
import { GroupForm } from '@/app/admin/email/groups/group-form'
import { RunGroupPreview } from '@/app/admin/email/groups/run-group-preview'
import { EmailGroupStorage } from '@/services/email-groups-storage'

export const metadata: Metadata = { title: 'Edit Email Group' }
export const runtime = 'nodejs'

export default async function EditGroupPage({ params }: { params: Promise<{ uuid: string }> }) {
	const { uuid } = await params
	const group = await EmailGroupStorage.get(uuid)
	if (!group) notFound()
	return (
		<AdminShell title="Edit group" description="Modify the target audience and MongoDB query.">
			<GroupForm group={group} />
			<RunGroupPreview groupUuid={group.uuid!} />
		</AdminShell>
	)
}
