import { NextResponse, type NextRequest } from 'next/server'
import { CrmTagStorage } from '@/services/crm-tags-storage'
import { requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const items = await CrmTagStorage.list()
		return NextResponse.json({ items })
	} catch (error) {
		return routeError(error)
	}
}
