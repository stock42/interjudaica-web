import type { Metadata } from 'next'

import { AdminShell, DataTable } from '@/app/components/portal-ui'
import { AuditLogStorage } from '@/services/audit-log-storage'

export const metadata: Metadata = {
	title: 'Admin Audit Logs',
	description: 'Review recent security and material activity.',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatDate(value: string): string {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return value || '-'
	}

	return date.toLocaleString('en-US')
}

export default async function AdminAuditLogsPage() {
	const logs = await AuditLogStorage.listRecent(150)

	return (
		<AdminShell
			title="Audit logs"
			description="Review recent login, account, class material, and download events."
		>
			<DataTable
				columns={['When', 'Action', 'Actor', 'Subject', 'IP', 'Details']}
				rows={
					logs.length ?
						logs.map(log => [
							formatDate(log.createdAt),
							log.action,
							[log.actorKind, log.email || log.actorUuid].filter(Boolean).join(' · ') ||
								'-',
							[log.subjectType, log.subjectUuid || log.classUuid || log.courseUuid]
								.filter(Boolean)
								.join(' · ') || '-',
							log.ip || '-',
							log.details || '-',
						])
					:	[['-', 'no_events', '-', '-', '-', 'No audit events captured yet']]
				}
			/>
		</AdminShell>
	)
}
