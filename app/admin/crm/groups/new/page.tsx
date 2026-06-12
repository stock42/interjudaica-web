import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { GroupForm } from '@/app/admin/crm/groups/group-form'
import AiCrmGroupCreateButton from '@/app/admin/crm/groups/ai-group-create-button'

export const metadata: Metadata = { title: 'New CRM Group' }
export const runtime = 'nodejs'

export default function NewGroupPage() {
	return (
		<AdminShell
			title="New group"
			description="Define a target segment with AI-generated MongoDB queries."
		>
			<div className="mb-4">
				<AiCrmGroupCreateButton />
			</div>
			<GroupForm />
		</AdminShell>
	)
}
