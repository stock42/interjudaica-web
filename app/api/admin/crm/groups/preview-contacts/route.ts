import { NextResponse, type NextRequest } from 'next/server'
import { MongoDBStorage } from '@/services/MongoDBStorage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	try {
		const { query } = await readJson(request)

		if (!query || typeof query !== 'string') {
			return NextResponse.json(
				{ error: 'query is required and must be a JSON string' },
				{ status: 400 },
			)
		}

		let filter: Record<string, unknown> = {}
		try {
			const parsed = JSON.parse(query)
			if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
				filter = parsed as Record<string, unknown>
			}
		} catch {
			return NextResponse.json(
				{ error: 'query must be valid JSON' },
				{ status: 400 },
			)
		}

		const count = Object.keys(filter).length > 0
			? await MongoDBStorage._count('crm_contacts', filter)
			: 0

		return NextResponse.json({ count })
	} catch (error) {
		return routeError(error)
	}
}
