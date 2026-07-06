import type { Metadata } from 'next'

import {
	ModerationQueue,
	type ModerationQueueItem,
} from '@/app/admin/moderation/moderation-queue'
import { AdminShell } from '@/app/components/portal-ui'
import { ContactStorage } from '@/services/contacts-storage'
import { ForumStorage } from '@/services/forums-storage'
import { OperatorStorage } from '@/services/operators-storage'

export const metadata: Metadata = {
	title: 'Admin Moderation',
	description: 'Review forum threads and contact messages by owner and due date.',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function text(value: unknown): string {
	return typeof value === 'string' ? value : ''
}

export default async function AdminModerationPage() {
	const [contacts, forums, operators] = await Promise.all([
		ContactStorage.list(),
		ForumStorage.list(),
		OperatorStorage.list(),
	])
	const items: ModerationQueueItem[] = [
		...contacts.map(contact => ({
			uuid: contact.uuid ?? '',
			kind: 'contact' as const,
			title:
				`${text(contact.firstName)} ${text(contact.lastName)}`.trim() ||
				text(contact.email) ||
				'Contact inquiry',
			subtitle: `${text(contact.email)} · ${text(contact.message)}`,
			status: contact.status ?? 'new',
			ownerOperatorUuid: contact.ownerOperatorUuid ?? '',
			dueAt: contact.dueAt ?? '',
			href: `/admin/contacts/${contact.uuid}`,
		})),
		...forums.map(thread => ({
			uuid: thread.uuid ?? '',
			kind: 'forum' as const,
			title: text(thread.title) || 'Forum thread',
			subtitle: `${text(thread.area)} · ${text(thread.courseSlug) || 'Community'}`,
			status: thread.status ?? 'open',
			ownerOperatorUuid: thread.ownerOperatorUuid ?? '',
			dueAt: thread.dueAt ?? '',
			href: `/admin/forum/${thread.uuid}`,
		})),
	]

	return (
		<AdminShell
			title="Moderation queue"
			description="Assign owners, set due dates, and move contact and forum items through review."
		>
			<ModerationQueue
				initialItems={items}
				operators={operators}
			/>
		</AdminShell>
	)
}
