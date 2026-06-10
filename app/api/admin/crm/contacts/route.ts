import { NextResponse, type NextRequest } from 'next/server'
import { schemaCrmContact } from '@/models/crm-contacts'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { CrmTagStorage } from '@/services/crm-tags-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') ?? '1', 10)
		const limit = parseInt(searchParams.get('limit') ?? '30', 10)
		const query = searchParams.get('q') ?? ''
		const sort = (searchParams.get('sort') ?? 'added') as
			| 'firstname'
			| 'lastname'
			| 'email'
			| 'added'
		const tagUuids = searchParams.get('tags')
			? searchParams.get('tags')!.split(',').filter(Boolean)
			: []

		const result = await CrmContactStorage.search({
			page,
			limit,
			query,
			tagUuids,
			sort,
		})

		return NextResponse.json(result)
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
		const raw = await readJson(request)

		// Resolve tag names → UUIDs inline before Zod parse
		// (schema validates tags as UUIDs, but we may receive tag names)
		if (raw.tags && Array.isArray(raw.tags) && raw.tags.length > 0) {
			const tagUuids: string[] = []

			for (const tagName of raw.tags) {
				if (typeof tagName !== 'string' || !tagName.trim()) continue
				// Check if it's already a UUID
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

		const payload = schemaCrmContact.parse(raw)

		const item = await CrmContactStorage.create(payload)
		return NextResponse.json({ item }, { status: 201 })
	} catch (error) {
		return routeError(error)
	}
}
