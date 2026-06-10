import { NextResponse, type NextRequest } from 'next/server'
import { schemaCrmContact } from '@/models/crm-contacts'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { CrmTagStorage } from '@/services/crm-tags-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	const { uuid } = await params
	const item = await CrmContactStorage.get(uuid)

	if (!item) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	return NextResponse.json({ item })
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const { uuid } = await params
		const raw = await readJson(request)

		// Resolve tag names → UUIDs inline before Zod parse
		if (raw.tags && Array.isArray(raw.tags) && raw.tags.length > 0) {
			const tagUuids: string[] = []

			for (const tagName of raw.tags) {
				if (typeof tagName !== 'string' || !tagName.trim()) continue
				if (/^[0-9a-f-]{36}$/i.test(tagName.trim())) {
					tagUuids.push(tagName.trim())
				} else {
					try {
						const tag = await CrmTagStorage.createIfNotExists(tagName.trim())
						if (tag.uuid) {
							tagUuids.push(tag.uuid)
						}
					} catch {
						// skip invalid tags
					}
				}
			}

			raw.tags = tagUuids
		}

		const payload = schemaCrmContact.partial().parse(raw)

		const item = await CrmContactStorage.update(uuid, payload)

		if (!item) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ item })
	} catch (error) {
		return routeError(error)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	const { uuid } = await params
	const deletedCount = await CrmContactStorage.delete(uuid)

	if (!deletedCount) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	return NextResponse.json({ deleted: true })
}
