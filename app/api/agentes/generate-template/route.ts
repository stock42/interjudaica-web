import { NextResponse, type NextRequest } from 'next/server'
import { generateTemplateHtml } from '@/lib/email-llm'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	try {
		const { promoting } = await readJson(request)
		if (!promoting || typeof promoting !== 'string' || !promoting.trim()) {
			return NextResponse.json(
				{ error: 'promoting is required' },
				{ status: 400 },
			)
		}
		const html = await generateTemplateHtml(promoting.trim(), '')
		return NextResponse.json({ html })
	} catch (error) {
		return routeError(error)
	}
}
