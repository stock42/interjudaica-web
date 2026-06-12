import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/app/components/portal-ui'
import { BookStorage } from '@/services/books-storage'
import { BookAiChatClient } from './book-ai-chat-client'

export const metadata: Metadata = {
	title: 'Book AI Assistant',
	description: 'AI-powered book development assistant with persistent memory.',
}

export const runtime = 'nodejs'

export default async function BookAiAssistantPage({
	params,
}: {
	params: Promise<{ uuid: string }>
}) {
	const { uuid } = await params
	const book = await BookStorage.get(uuid)

	if (!book?.uuid) {
		notFound()
	}

	return (
		<AdminShell
			title={`AI Assistant — ${book.title}`}
			description="Develop and refine this book's content with AI assistance. Conversations persist across sessions."
		>
			<BookAiChatClient bookUuid={book.uuid} bookTitle={book.title} />
		</AdminShell>
	)
}
