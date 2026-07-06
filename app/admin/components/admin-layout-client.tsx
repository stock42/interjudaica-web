'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import AiChatDrawer from '@/app/admin/components/ai-chat-drawer'
import { AdminCommandPalette } from '@/app/admin/components/admin-command-palette'

interface AdminChatContextValue {
	openChat: () => void
	openCommand: () => void
}

const AdminChatContext = createContext<AdminChatContextValue | null>(null)

export function AdminLayoutClient({ children }: { children: ReactNode }) {
	const [chatOpen, setChatOpen] = useState(false)
	const [commandOpen, setCommandOpen] = useState(false)

	return (
		<AdminChatContext.Provider
			value={{
				openChat: () => setChatOpen(true),
				openCommand: () => setCommandOpen(true),
			}}
		>
			<div data-admin-route="true">
				{children}
				<AdminCommandPalette
					open={commandOpen}
					onOpenChange={setCommandOpen}
				/>
				<AiChatDrawer
					open={chatOpen}
					onOpenChange={setChatOpen}
				/>
			</div>
		</AdminChatContext.Provider>
	)
}

export function useAdminChat(): AdminChatContextValue {
	const ctx = useContext(AdminChatContext)
	if (!ctx) throw new Error('useAdminChat must be used within AdminLayoutClient')
	return ctx
}
