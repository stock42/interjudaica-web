import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { CrmGroupsList } from '@/app/admin/crm/groups/groups-list'

export const metadata: Metadata = { title: 'CRM Groups' }
export const runtime = 'nodejs'

export default function GroupsPage() {
	return <AdminShell title="CRM Groups" description="Segment CRM contacts into groups with MongoDB queries."><CrmGroupsList /></AdminShell>
}
