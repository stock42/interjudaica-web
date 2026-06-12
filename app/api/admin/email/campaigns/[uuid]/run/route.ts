import { NextResponse, type NextRequest } from 'next/server'
import { EmailCampaignStorage } from '@/services/email-campaigns-storage'
import { EmailTemplateStorage } from '@/services/email-templates-storage'
import { EmailGroupStorage } from '@/services/email-groups-storage'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { getEmailFrom } from '@/lib/resend'
import { requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	try {
		const { uuid } = await params
		const campaign = await EmailCampaignStorage.get(uuid)
		if (!campaign)
			return NextResponse.json({ error: 'Not found' }, { status: 404 })

		const [template, group] = await Promise.all([
			EmailTemplateStorage.get(campaign.templateUuid),
			EmailGroupStorage.get(campaign.groupUuid),
		])
		if (!template)
			return NextResponse.json({ error: 'Template not found' }, { status: 404 })
		if (!group)
			return NextResponse.json({ error: 'Group not found' }, { status: 404 })

		let queryObj: Record<string, unknown> = {}
		try {
			queryObj = JSON.parse(group.query || '{}')
		} catch {
			return NextResponse.json(
				{ error: 'Invalid group query JSON' },
				{ status: 400 },
			)
		}

		const contacts = await CrmContactStorage.getMatchingContacts(queryObj)

		if (contacts.length === 0) {
			await EmailCampaignStorage.update(uuid, { status: 'done' })
			return NextResponse.json({ message: 'No contacts matched', count: 0 })
		}

		await EmailCampaignStorage.update(uuid, { status: 'running' })

		const fromEmail = getEmailFrom()
		const deliveryTime = campaign.deliveryTime

		const spoolerItems = contacts.map((contact) => {
			const subject = renderTemplate(template.subject, contact)
			const html = renderTemplate(template.html, contact)
			return {
				from: fromEmail,
				to: contact.email,
				subject,
				body: html,
				campaignUuid: uuid,
				deliveryTime,
				status: 'new' as const,
			}
		})

		await EmailSpoolerStorage.createBatch(spoolerItems)

		return NextResponse.json({
			message: 'Campaign initialized',
			count: contacts.length,
		})
	} catch (error) {
		return routeError(error)
	}
}

function renderTemplate(
	html: string,
	contact: { firstname: string; lastname: string; email: string },
) {
	return html
		.replace(/\{\{firstname\}\}/g, contact.firstname)
		.replace(/\{\{lastname\}\}/g, contact.lastname)
		.replace(/\{\{email\}\}/g, contact.email)
}
