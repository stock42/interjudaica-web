import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { TemplateForm } from '@/app/admin/email/templates/template-form'

export const metadata: Metadata = { title: 'New Email Template' }
export const runtime = 'nodejs'

export default function NewTemplatePage() {
	return <AdminShell title="New template" description="Create an email template with AI-assisted HTML generation."><TemplateForm /></AdminShell>
}
