import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { ContactList } from '@/app/admin/crm/contacts/contact-list'

export const metadata: Metadata = {
	title: 'CRM — Contacts',
	description: 'Manage CRM contacts, tags, and import/export.',
}

export const runtime = 'nodejs'

export default function CrmContactsPage() {
	return (
		<AdminShell
			title="CRM — Contacts"
			description="Search, filter, and manage contacts. Import CSV files and export filtered results."
		>
			<ContactList />
		</AdminShell>
	)
}
