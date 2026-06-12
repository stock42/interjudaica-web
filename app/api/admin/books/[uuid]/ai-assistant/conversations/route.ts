import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { BookAiConversationStorage } from '@/services/book-ai-conversation-storage'
import { ChatStorage } from '@/services/chat-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

const schemaCreate = z.object({
	threadUuid: z.string().uuid(),
	title: z.string().max(200).optional(),
})

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	const { uuid: bookUuid } = await params
	const conversations =
		await BookAiConversationStorage.listByBook(bookUuid)
	return NextResponse.json({ items: conversations })
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	try {
		const { uuid: bookUuid } = await params
		const body = schemaCreate.parse(await readJson(request))

		// Verify the thread exists
		const thread = await ChatStorage.getThread(body.threadUuid)
		if (!thread) {
			return NextResponse.json(
				{ error: 'Chat thread not found' },
				{ status: 404 },
			)
		}

		const item = await BookAiConversationStorage.create(
			bookUuid,
			auth.operator.uuid,
			body.threadUuid,
			body.title,
		)
		return NextResponse.json({ item }, { status: 201 })
	} catch (error) {
		return routeError(error)
	}
}
