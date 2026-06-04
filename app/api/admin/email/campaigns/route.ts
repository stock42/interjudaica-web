import { NextResponse, type NextRequest } from 'next/server'
import { schemaEmailCampaign } from '@/models/email-campaigns'
import { EmailCampaignStorage } from '@/services/email-campaigns-storage'
import { EmailTemplateStorage } from '@/services/email-templates-storage'
import { EmailGroupStorage } from '@/services/email-groups-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response
	try {
		const campaigns = await EmailCampaignStorage.list()
		const items = await Promise.all(
			campaigns.map(async (c) => {
				const [stats, template, group] = await Promise.all([
					EmailCampaignStorage.getStats(c.uuid ?? ''),
					EmailTemplateStorage.get(c.templateUuid),
					EmailGroupStorage.get(c.groupUuid),
				])
				return {
					...c,
					stats,
					templateName: template?.name ?? 'Unknown',
					groupName: group?.name ?? 'Unknown',
				}
			}),
		)
		return NextResponse.json({ items })
	} catch (error) {
		return routeError(error)
	}
}

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response
	try {
		const payload = schemaEmailCampaign.parse(await readJson(request))
		const item = await EmailCampaignStorage.create(payload)
		return NextResponse.json({ item }, { status: 201 })
	} catch (error) {
		return routeError(error)
	}
}
