import 'server-only'

import { getCurrentOperator } from '@/services/auth'
import { getCurrentUser } from '@/services/user-auth'
import { ChatStorage } from '@/services/chat-storage'

export const runtime = 'nodejs'

async function authenticate() {
	const operator = await getCurrentOperator()
	const user = await getCurrentUser()

	if (!operator && !user) {
		return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
	}

	return { authUser: operator ?? user! }
}

async function verifyOwnership(threadUuid: string, userUuid: string) {
	const thread = await ChatStorage.getThread(threadUuid)

	if (!thread) {
		return { error: Response.json({ error: 'Thread not found' }, { status: 404 }) }
	}

	if (thread.userUuid !== userUuid) {
		return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
	}

	return { thread }
}

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await authenticate()
	if ('error' in auth) return auth.error

	const { uuid } = await params

	const ownership = await verifyOwnership(uuid, auth.authUser.uuid)
	if ('error' in ownership) return ownership.error

	const messages = await ChatStorage.getMessages(uuid)
	return Response.json({ messages })
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await authenticate()
	if ('error' in auth) return auth.error

	const { uuid } = await params

	const ownership = await verifyOwnership(uuid, auth.authUser.uuid)
	if ('error' in ownership) return ownership.error

	await ChatStorage.deleteThread(uuid)
	return Response.json({ deleted: true })
}
