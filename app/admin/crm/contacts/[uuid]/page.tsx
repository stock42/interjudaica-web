import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/app/components/portal-ui'
import { ContactForm } from '@/app/admin/crm/contacts/contact-form'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { CrmTagStorage } from '@/services/crm-tags-storage'

export const metadata: Metadata = {
	title: 'Edit Contact — CRM',
	description: 'Edit a CRM contact.',
}

export const runtime = 'nodejs'

export default async function EditContactPage({
	params,
}: {
	params: Promise<{ uuid: string }>
}) {
	const { uuid } = await params
	const [contact, tags] = await Promise.all([
		CrmContactStorage.get(uuid),
		CrmTagStorage.list(),
	])

	if (!contact) {
		notFound()
	}

	// Resolve tag UUIDs to names for the form
	const tagNames: string[] = contact.tags
		.map((tagUuid: string) => tags.find((t) => t.uuid === tagUuid)?.name ?? '')
		.filter(Boolean)

	return (
		<AdminShell
			title="Edit contact"
			description="Update contact details, tags, and notes."
		>
			<ContactForm contact={{ ...contact, tagNames }} />
		</AdminShell>
	)
}
