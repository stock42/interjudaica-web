import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { runUploadCleanup } from '@/services/upload-cleanup'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

const schemaCleanupRequest = z.object({
	confirm: z.coerce.boolean().default(false),
})

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) {
		return auth.response
	}

	try {
		const report = await runUploadCleanup({ deleteFiles: false })
		return NextResponse.json({ report })
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
		const payload = schemaCleanupRequest.parse(await readJson(request))
		const report = await runUploadCleanup({ deleteFiles: payload.confirm })
		return NextResponse.json({ report })
	} catch (error) {
		return routeError(error)
	}
}
