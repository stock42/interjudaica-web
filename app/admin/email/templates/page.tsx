import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { EmailTemplatesList } from '@/app/admin/email/templates/templates-list'

export const metadata: Metadata = { title: 'Email Templates' }
export const runtime = 'nodejs'

export default function TemplatesPage() {
	return (
		<AdminShell title="Email Templates" description="Manage email HTML templates with AI-generated content.">
			<EmailTemplatesList />
		</AdminShell>
	)
}
