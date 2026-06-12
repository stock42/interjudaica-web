import { NextResponse, type NextRequest } from 'next/server'
import { schemaCrmGroup } from '@/models/crm-groups'
import { CrmGroupStorage } from '@/services/crm-groups-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response
	try {
		const items = await CrmGroupStorage.list()
		return NextResponse.json({ items })
	} catch (error) {
		return routeError(error)
	}
}

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response
	try {
		const payload = schemaCrmGroup.parse(await readJson(request))
		const item = await CrmGroupStorage.create(payload)
		return NextResponse.json({ item }, { status: 201 })
	} catch (error) {
		return routeError(error)
	}
}
