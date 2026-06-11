import 'server-only'

import { getCurrentOperator } from '@/services/auth'
import { getCurrentUser } from '@/services/user-auth'
import { ChatStorage } from '@/services/chat-storage'
import type { TypeChatThread } from '@/models/chat-threads'

export const runtime = 'nodejs'

async function deriveDisplayTitle(
	thread: TypeChatThread,
): Promise<string> {
	if (thread.title !== 'New Chat' || thread.messageCount === 0) {
		return thread.title
	}
	const messages = await ChatStorage.getMessages(thread.uuid)
	const firstUser = messages.find((m) => m.role === 'user')
	if (firstUser) {
		const content = firstUser.content.trim()
		return content.length > 60 ? content.slice(0, 57) + '...' : content
	}
	return thread.title
}

export async function GET() {
	const operator = await getCurrentOperator()
	const user = await getCurrentUser()

	if (!operator && !user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const authUser = operator ?? user!
	const threads = await ChatStorage.getThreads(authUser.uuid)

	const threadsWithDisplay = await Promise.all(
		threads.map(async (thread) => ({
			...thread,
			displayTitle: await deriveDisplayTitle(thread),
		})),
	)

	return Response.json({ threads: threadsWithDisplay })
}
