import { NextResponse, type NextRequest } from 'next/server'
import { EmailCampaignStorage } from '@/services/email-campaigns-storage'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'
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

		if (campaign.status !== 'running')
			return NextResponse.json(
				{ error: `Campaign is not running (status: ${campaign.status})` },
				{ status: 409 },
			)

		// Mark campaign as stopped — prevents further spooler processing
		await EmailCampaignStorage.update(uuid, { status: 'stopped' })

		// Cancel all pending spooler entries for this campaign
		await EmailSpoolerStorage.cancelPending(uuid)

		return NextResponse.json({ message: 'Campaign stopped', uuid })
	} catch (error) {
		return routeError(error)
	}
}
