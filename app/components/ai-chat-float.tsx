'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Bot, Send } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type StudentUser = {
	uuid: string
	email: string
	firstName?: string | null
	lastName?: string | null
}

const WELCOME_MESSAGE =
	"Shalom! I'm the InterJudaica AI assistant. How can I help you with your Jewish learning journey today?"

// ── Safe react-markdown renderer ────────────────────────────────────────
// Lazy-loaded to avoid bundling on every page until the sheet opens.

const Markdown = dynamic(
	() => import('react-markdown').then((mod) => mod.default),
	{ ssr: false },
)

function MessageBubble({
	role,
	content,
}: {
	role: 'user' | 'assistant'
	content: string
}) {
	const isUser = role === 'user'

	return (
		<div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
			<div
				className={cn(
					'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
					isUser
						? 'rounded-br-sm bg-[var(--gold)]/15 text-[var(--ink)]'
						: 'rounded-bl-sm bg-[var(--surface-soft)] text-[var(--ink)]',
				)}
			>
				{isUser ? (
					<p>{content}</p>
				) : content ? (
					<div className="prose prose-sm prose-invert max-w-none [&_*]:text-[var(--ink)]">
						<Markdown>{content}</Markdown>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<Spinner className="size-3 text-[var(--gold)]" />
						<span className="text-[var(--muted)]">Thinking…</span>
					</div>
				)}
			</div>
		</div>
	)
}

export function AiChatFloat() {
	const pathname = usePathname()
	const [user, setUser] = useState<StudentUser | null>(null)
	const [authLoaded, setAuthLoaded] = useState(false)
	const [sheetOpen, setSheetOpen] = useState(false)

	const messagesEndRef = useRef<HTMLDivElement>(null)

	// ── Auth check on mount ────────────────────────────────────────────
	useEffect(() => {
		let active = true

		async function load() {
			try {
				const res = await fetch('/api/user-auth/me', { cache: 'no-store' })
				if (!active) return
				if (res.ok) {
					const data = await res.json().catch(() => ({}))
					setUser(data.user ?? null)
				} else {
					setUser(null)
				}
			} catch {
				if (active) setUser(null)
			}
			if (active) setAuthLoaded(true)
		}

		load()

		return () => {
			active = false
		}
	}, [])

	// ── Chat hook ──────────────────────────────────────────────────────
	const [input, setInput] = useState('')

	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({
			api: '/api/agentes/chat',
		}),
	})

	// ── Scroll to bottom on new messages ───────────────────────────────
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	// ── Hide on admin pages or when unauthenticated ────────────────────
	const isAdminPath =
		pathname.startsWith('/admin') || pathname.startsWith('/operator-login')

	if (isAdminPath) return null
	if (!authLoaded) return null
	if (!user) return null

	const isLoading =
		status === 'submitted' || status === 'streaming'
	const hasMessages = messages.length > 0

	return (
		<>
			{/* ── Floating Action Button ──────────────────────────── */}
			<Button
				onClick={() => setSheetOpen(true)}
				className={cn(
					'fixed bottom-6 right-6 z-[60] size-14 rounded-full border-0 p-0',
					'shadow-[0_4px_24px_rgba(244,189,51,0.35)]',
					'hover:shadow-[0_6px_32px_rgba(244,189,51,0.5)]',
					'transition-shadow duration-200',
				)}
				variant="default"
				size="icon"
				aria-label="Open AI chat"
			>
				<Bot className="size-6" />
			</Button>

			{/* ── Chat Sheet ──────────────────────────────────────── */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent
					side="right"
					className="flex w-full flex-col p-0 sm:!max-w-[400px]"
					data-side="right"
				>
					{/* Header */}
					<SheetHeader className="shrink-0 border-b border-[var(--line)] px-4 py-4">
						<SheetTitle className="flex items-center gap-2 text-[var(--ink)]">
							<Bot className="size-5 text-[var(--gold)]" />
							InterJudaica AI
						</SheetTitle>
						<SheetDescription className="text-[var(--muted)]">
							Ask me about courses, papers, books, or anything
							Jewish learning
						</SheetDescription>
					</SheetHeader>

					{/* Messages */}
					<div className="flex-1 overflow-y-auto px-4 py-4">
						{!hasMessages && !isLoading ? (
							<div className="flex h-full items-center justify-center">
								<div className="max-w-[85%] rounded-xl rounded-bl-sm bg-[var(--surface-soft)] px-3 py-2 text-sm leading-relaxed text-[var(--ink)]">
									<p>{WELCOME_MESSAGE}</p>
								</div>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								{messages.map((m) => {
									const textContent = m.parts
										.filter(
											(p): p is { type: 'text'; text: string } =>
												p.type === 'text',
										)
										.map((p) => p.text)
										.join('')

									if (!textContent) return null

									return (
										<MessageBubble
											key={m.id}
											role={
												m.role === 'user'
													? 'user'
													: 'assistant'
											}
											content={textContent}
										/>
									)
								})}

								{isLoading &&
									(!hasMessages ||
										messages[messages.length - 1]?.role !==
											'assistant') && (
										<MessageBubble
											role="assistant"
											content=""
										/>
									)}

								<div ref={messagesEndRef} />
							</div>
						)}
					</div>

					{/* Input */}
					<form
						onSubmit={(e) => {
							e.preventDefault()
							if (!input.trim() || isLoading) return
							sendMessage({ text: input })
							setInput('')
						}}
						className="shrink-0 border-t border-[var(--line)] p-3"
					>
						<div className="flex items-end gap-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
							<textarea
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (
										e.key === 'Enter' &&
										!e.shiftKey &&
										input.trim()
									) {
										e.preventDefault()
										if (!isLoading) {
											const form = e.currentTarget
												.closest('form')!
											form.requestSubmit()
										}
									}
								}}
								placeholder="Type your question…"
								rows={1}
								disabled={isLoading}
								className="flex-1 resize-none bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 outline-none"
							/>
							<Button
								variant="ghost"
								size="icon-sm"
								type="submit"
								disabled={isLoading || !input.trim()}
								className="shrink-0 text-[var(--gold)] hover:text-[var(--gold)] disabled:text-[var(--muted)]"
							>
								{isLoading ? (
									<Spinner className="size-4" />
								) : (
									<Send className="size-4" />
								)}
							</Button>
						</div>
					</form>
				</SheetContent>
			</Sheet>
		</>
	)
}
