import { NextResponse, type NextRequest } from 'next/server'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'
import { requireAdminApi } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string; spoolerUuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	const { spoolerUuid } = await params
	const ok = await EmailSpoolerStorage.retrySingle(spoolerUuid)
	if (!ok)
		return NextResponse.json(
			{ error: 'Email not found or not in error state' },
			{ status: 404 },
		)
	return NextResponse.json({ ok: true })
}
