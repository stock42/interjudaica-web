import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'

import { OwnerBioStorage } from '@/services/owner-bio-storage'
import { requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

const schemaUpdate = z.object({
	title: z.string().trim().min(1),
	markdown: z.string().trim().min(1),
})

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) {
		return auth.response
	}

	const item = await OwnerBioStorage.getBySlug('ernesto-yattah')
	return NextResponse.json({ item })
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) {
		return auth.response
	}

	try {
		const payload = schemaUpdate.parse(await request.json())
		const item = await OwnerBioStorage.upsertBySlug('ernesto-yattah', payload)
		revalidateTag('owner-bio', 'max')
		revalidateTag('ernesto-yattah', 'max')
		return NextResponse.json({ item })
	} catch (error) {
		return routeError(error)
	}
}
