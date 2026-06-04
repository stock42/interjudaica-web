import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { EmailGroupsList } from '@/app/admin/email/groups/groups-list'

export const metadata: Metadata = { title: 'Email Groups' }
export const runtime = 'nodejs'

export default function GroupsPage() {
	return <AdminShell title="Email Groups" description="Create contact groups with AI-generated MongoDB queries."><EmailGroupsList /></AdminShell>
}
