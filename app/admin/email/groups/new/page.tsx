import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { GroupForm } from '@/app/admin/email/groups/group-form'
import AiEmailGroupCreateButton from '@/app/admin/email/groups/ai-group-create-button'

export const metadata: Metadata = { title: 'New Email Group' }
export const runtime = 'nodejs'

export default function NewGroupPage() {
	return (
		<AdminShell
			title="New group"
			description="Define a target audience with AI-generated MongoDB queries."
		>
			<div className="mb-4">
				<AiEmailGroupCreateButton />
			</div>
			<GroupForm />
		</AdminShell>
	)
}
