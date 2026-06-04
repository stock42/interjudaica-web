import { NextResponse, type NextRequest } from 'next/server'
import {
	schemaCrmCampaignContactUpdate,
} from '@/models/crm-campaign-contacts'
import { CrmCampaignContactStorage } from '@/services/crm-campaign-contacts-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string; contactUuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const { uuid: campaignUuid, contactUuid } = await params
		const { status } = schemaCrmCampaignContactUpdate.parse(
			await readJson(request),
		)

		const updated = await CrmCampaignContactStorage.updateStatus(
			campaignUuid,
			contactUuid,
			status,
		)

		if (!updated) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ item: updated })
	} catch (error) {
		return routeError(error)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string; contactUuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	const { uuid: campaignUuid, contactUuid } = await params
	const deletedCount = await CrmCampaignContactStorage.unassign(
		campaignUuid,
		contactUuid,
	)

	if (!deletedCount) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	return NextResponse.json({ deleted: true })
}
