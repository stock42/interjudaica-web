import { NextResponse, type NextRequest } from 'next/server'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'
import { requireAdminApi } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	const { uuid } = await params
	const { searchParams } = new URL(request.url)
	const page = parseInt(searchParams.get('page') ?? '1', 10)
	const limit = parseInt(searchParams.get('limit') ?? '30', 10)
	const status = searchParams.get('status') ?? undefined

	const result = await EmailSpoolerStorage.listByCampaign(uuid, {
		page,
		limit,
		status,
	})

	return NextResponse.json(result)
}
