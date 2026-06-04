import { NextResponse, type NextRequest } from 'next/server'
import { schemaSubscriptionPlan } from '@/models/subscription-plans'
import { SubscriptionPlanStorage } from '@/services/subscription-plans-storage'
import {
	readJson,
	requireAdminApi,
	routeError,
} from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) {
		return auth.response
	}

	const items = await SubscriptionPlanStorage.list(true)
	return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) {
		return auth.response
	}

	try {
		const payload = schemaSubscriptionPlan.parse(await readJson(request))
		const item = await SubscriptionPlanStorage.create(payload)
		return NextResponse.json({ item }, { status: 201 })
	} catch (error) {
		return routeError(error)
	}
}
