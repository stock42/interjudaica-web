import { NextResponse, type NextRequest } from 'next/server'
import { CrmCampaignContactStorage } from '@/services/crm-campaign-contacts-storage'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const { uuid } = await params

		const campaignContactLinks =
			await CrmCampaignContactStorage.listByCampaign(uuid)

		const items = await Promise.all(
			campaignContactLinks.map(async (link) => {
				const contact = await CrmContactStorage.get(
					link.contactUuid,
				)
				return {
					campaignContactUuid: link.uuid,
					contact,
					status: link.status,
				}
			}),
		)

		return NextResponse.json({ items })
	} catch (error) {
		return routeError(error)
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const { uuid } = await params
		const { contactUuids, status } = await readJson(request)

		if (
			!Array.isArray(contactUuids) ||
			contactUuids.length === 0
		) {
			return NextResponse.json(
				{ error: 'contactUuids must be a non-empty array' },
				{ status: 400 },
			)
		}

		const result = await CrmCampaignContactStorage.assignBatch(
			uuid,
			contactUuids,
			typeof status === 'string' ? status : '',
		)

		return NextResponse.json(result, { status: 201 })
	} catch (error) {
		return routeError(error)
	}
}
