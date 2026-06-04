import { NextResponse, type NextRequest } from 'next/server'
import { schemaEmailGroup } from '@/models/email-groups'
import { EmailGroupStorage } from '@/services/email-groups-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response
	try {
		const items = await EmailGroupStorage.list()
		return NextResponse.json({ items })
	} catch (error) {
		return routeError(error)
	}
}

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response
	try {
		const payload = schemaEmailGroup.parse(await readJson(request))
		const item = await EmailGroupStorage.create(payload)
		return NextResponse.json({ item }, { status: 201 })
	} catch (error) {
		return routeError(error)
	}
}
