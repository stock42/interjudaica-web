import { NextResponse, type NextRequest } from 'next/server'
import { schemaCrmCampaign } from '@/models/crm-campaigns'
import { CrmCampaignStorage } from '@/services/crm-campaigns-storage'
import { CrmCampaignContactStorage } from '@/services/crm-campaign-contacts-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const campaigns = await CrmCampaignStorage.list()

		const items = await Promise.all(
			campaigns.map(async (c) => ({
				...c,
				contactCount: await CrmCampaignContactStorage.countByCampaign(
					c.uuid ?? '',
				),
			})),
		)

		return NextResponse.json({ items })
	} catch (error) {
		return routeError(error)
	}
}

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const payload = schemaCrmCampaign.parse(await readJson(request))
		const item = await CrmCampaignStorage.create(payload)
		return NextResponse.json({ item }, { status: 201 })
	} catch (error) {
		return routeError(error)
	}
}
