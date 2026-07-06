import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { schemaContact } from '@/models/contacts'
import { schemaForumThread } from '@/models/forums'
import { ContactStorage } from '@/services/contacts-storage'
import { ForumStorage } from '@/services/forums-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

const schemaModerationPayload = z.object({
	status: z.string().trim().optional(),
	ownerOperatorUuid: z.string().trim().optional(),
	dueAt: z.string().trim().optional(),
})

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ kind: string; uuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) {
		return auth.response
	}

	try {
		const { kind, uuid } = await params
		const payload = schemaModerationPayload.parse(await readJson(request))

		if (kind === 'contact') {
			const update = schemaContact
				.pick({ status: true, ownerOperatorUuid: true, dueAt: true })
				.partial()
				.parse(payload)
			const item = await ContactStorage.update(uuid, update)
			if (!item) {
				return NextResponse.json({ error: 'Not found' }, { status: 404 })
			}

			return NextResponse.json({ item })
		}

		if (kind === 'forum') {
			const update = schemaForumThread
				.pick({ status: true, ownerOperatorUuid: true, dueAt: true })
				.partial()
				.parse(payload)
			const item = await ForumStorage.update(uuid, update)
			if (!item) {
				return NextResponse.json({ error: 'Not found' }, { status: 404 })
			}

			return NextResponse.json({ item })
		}

		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	} catch (error) {
		return routeError(error)
	}
}
