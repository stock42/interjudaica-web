import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { ContactForm } from '@/app/admin/crm/contacts/contact-form'

export const metadata: Metadata = {
	title: 'New Contact — CRM',
	description: 'Create a new CRM contact.',
}

export const runtime = 'nodejs'

export default function NewContactPage() {
	return (
		<AdminShell
			title="New contact"
			description="Create a new contact with tags and notes."
		>
			<ContactForm />
		</AdminShell>
	)
}
