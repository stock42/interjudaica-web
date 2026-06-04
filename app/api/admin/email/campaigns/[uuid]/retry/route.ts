import { NextResponse, type NextRequest } from 'next/server'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'
import { requireAdminApi } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	const { uuid } = await params
	const count = await EmailSpoolerStorage.retryErrors(uuid)
	return NextResponse.json({ retried: count })
}
