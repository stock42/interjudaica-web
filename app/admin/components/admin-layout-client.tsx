'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import AiChatDrawer from '@/app/admin/components/ai-chat-drawer'

interface AdminChatContextValue {
	openChat: () => void
}

const AdminChatContext = createContext<AdminChatContextValue | null>(null)

export function AdminLayoutClient({ children }: { children: ReactNode }) {
	const [chatOpen, setChatOpen] = useState(false)

	return (
		<AdminChatContext.Provider value={{ openChat: () => setChatOpen(true) }}>
			{children}
			<AiChatDrawer open={chatOpen} onOpenChange={setChatOpen} />
		</AdminChatContext.Provider>
	)
}

export function useAdminChat(): AdminChatContextValue {
	const ctx = useContext(AdminChatContext)
	if (!ctx)
		throw new Error(
			'useAdminChat must be used within AdminLayoutClient',
		)
	return ctx
}
