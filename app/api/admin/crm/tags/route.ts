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

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const body = await request.json()
		const { name } = body
		if (!name || typeof name !== 'string' || !name.trim()) {
			return NextResponse.json(
				{ error: 'Name is required' },
				{ status: 400 },
			)
		}
		const normalized = name.trim().toLowerCase()
		const existing = await CrmTagStorage.findByName(normalized)
		const isNew = !existing
		const item = await CrmTagStorage.createIfNotExists(name.trim())
		return NextResponse.json({ item }, { status: isNew ? 201 : 200 })
	} catch (error) {
		return routeError(error)
	}
}
