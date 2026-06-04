import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/app/components/portal-ui'
import { TemplateForm } from '@/app/admin/email/templates/template-form'
import { EmailTemplateStorage } from '@/services/email-templates-storage'

export const metadata: Metadata = { title: 'Edit Email Template' }
export const runtime = 'nodejs'

export default async function EditTemplatePage({ params }: { params: Promise<{ uuid: string }> }) {
	const { uuid } = await params
	const template = await EmailTemplateStorage.get(uuid)
	if (!template) notFound()
	return <AdminShell title="Edit template" description="Modify the template HTML and subject."><TemplateForm template={template} /></AdminShell>
}
