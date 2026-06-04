import { NextResponse, type NextRequest } from 'next/server'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'
import { requireAdminApi } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string; spoolerUuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	const { spoolerUuid } = await params
	const item = await EmailSpoolerStorage.get(spoolerUuid)
	if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	return NextResponse.json({ item })
}
