import { NextResponse, type NextRequest } from 'next/server'
import { EmailGroupStorage } from '@/services/email-groups-storage'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	try {
		const { uuid } = await params
		const group = await EmailGroupStorage.get(uuid)
		if (!group)
			return NextResponse.json({ error: 'Not found' }, { status: 404 })

		if (!group.query || !group.query.trim()) {
			return NextResponse.json({ items: [], count: 0 })
		}

		let queryObj: Record<string, unknown> = {}
		try {
			const parsed = JSON.parse(group.query)
			if (
				typeof parsed === 'object' &&
				parsed !== null &&
				!Array.isArray(parsed)
			) {
				queryObj = parsed as Record<string, unknown>
			}
		} catch {
			return NextResponse.json(
				{ error: 'Group query is not valid JSON' },
				{ status: 400 },
			)
		}

		const contacts = await CrmContactStorage.getMatchingContacts(queryObj)

		return NextResponse.json({
			items: contacts,
			count: contacts.length,
		})
	} catch (error) {
		return routeError(error)
	}
}
