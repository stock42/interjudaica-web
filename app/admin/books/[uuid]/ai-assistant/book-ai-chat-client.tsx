'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithApprovalResponses,
} from 'ai'
import {
	Bot,
	Send,
	ChevronRight,
	Wrench,
	Brain,
	Plus,
	MessageSquare,
	Trash2,
	BookOpen,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface BookAiChatClientProps {
	bookUuid: string
	bookTitle: string
}

interface Conversation {
	uuid: string
	bookUuid: string
	threadUuid: string
	title: string
	createdAt: string
	updatedAt: string
}

export function BookAiChatClient({
	bookUuid,
	bookTitle,
}: BookAiChatClientProps) {
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [activeThreadUuid, setActiveThreadUuid] = useState<
		string | undefined
	>(undefined)
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [loadingConvs, setLoadingConvs] = useState(true)

	const chatApi = `/api/admin/books/${bookUuid}/ai-assistant/chat`
	const convsApi = `/api/admin/books/${bookUuid}/ai-assistant/conversations`

	const fetchConversations = useCallback(async () => {
		const res = await fetch(convsApi)
		if (!res.ok) throw new Error('Failed')
		const data = await res.json()
		return data.items || []
	}, [convsApi])

	const refreshConversations = useCallback(async () => {
		try {
			const items = await fetchConversations()
			setConversations(items)
		} catch {
			// silent
		}
	}, [fetchConversations])

	useEffect(() => {
		let ignore = false
		fetchConversations()
			.then((items) => {
				if (!ignore) setConversations(items)
			})
			.catch(() => {})
			.finally(() => {
				if (!ignore) setLoadingConvs(false)
			})
		return () => {
			ignore = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// useChat with the dedicated endpoint
	const {
		messages,
		sendMessage,
		addToolApprovalResponse,
		status,
		setMessages,
	} = useChat({
		transport: new DefaultChatTransport({
			api: chatApi,
		}),
		id: activeThreadUuid,
		sendAutomaticallyWhen:
			lastAssistantMessageIsCompleteWithApprovalResponses,
	})

	const [input, setInput] = useState('')
	const scrollRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// Auto-scroll
	const scrollToBottom = useCallback(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [])

	useEffect(() => {
		scrollToBottom()
	}, [messages, scrollToBottom])

	// Start new conversation
	const handleNewConversation = useCallback(() => {
		setMessages([])
		setActiveThreadUuid(undefined)
	}, [setMessages])

	// Select conversation
	const handleSelectConversation = useCallback(
		(threadUuid: string) => {
			setActiveThreadUuid(threadUuid)
			setMessages([])
		},
		[setMessages],
	)

	// Submit handler
	const handleSubmit = useCallback(() => {
		const trimmed = input.trim()
		if (!trimmed) return
		sendMessage({ text: trimmed })
		setInput('')
	}, [input, sendMessage])

	// Key handler
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				handleSubmit()
			}
		},
		[handleSubmit],
	)

	// Delete conversation
	const handleDeleteConversation = useCallback(
		async (convUuid: string) => {
			try {
				await fetch(`${convsApi}?convUuid=${convUuid}`, {
					method: 'DELETE',
				})
				if (
					conversations.find((c) => c.uuid === convUuid)
						?.threadUuid === activeThreadUuid
				) {
					setActiveThreadUuid(undefined)
					setMessages([])
				}
				refreshConversations()
			} catch {
				// silent
			}
		},
		[
			convsApi,
			conversations,
			activeThreadUuid,
			setMessages,
			refreshConversations,
		],
	)

	const isLoading = status === 'submitted' || status === 'streaming'

	return (
		<div className="flex h-[calc(100vh-12rem)] gap-0 border border-[var(--line)] rounded-lg overflow-hidden">
			{/* ── Sidebar ──────────────────────────────────── */}
			<div
				className={cn(
					'shrink-0 border-r border-[var(--line)] bg-[var(--surface-soft)] flex flex-col transition-all duration-200',
					sidebarOpen ? 'w-64' : 'w-0 overflow-hidden',
				)}
			>
				<div className="p-3 border-b border-[var(--line)]">
					<Button
						variant="outline"
						size="sm"
						className="w-full justify-start gap-2 text-xs border-[var(--line-soft)]"
						onClick={handleNewConversation}
					>
						<Plus className="size-3.5" />
						New conversation
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto p-2">
					{loadingConvs ? (
						<div className="p-3 text-xs text-[var(--muted)]">
							Loading…
						</div>
					) : conversations.length === 0 ? (
						<div className="p-3 text-xs text-[var(--muted)]">
							No conversations yet. Start a new one!
						</div>
					) : (
						<div className="space-y-0.5">
							{conversations.map((conv) => (
								<div
									key={conv.uuid}
									className={cn(
										'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors',
										conv.threadUuid === activeThreadUuid
											? 'bg-[var(--gold)]/10 text-[var(--ink)]'
											: 'text-[var(--muted)] hover:bg-[var(--line-soft)]/30 hover:text-[var(--ink)]',
									)}
									onClick={() =>
										handleSelectConversation(
											conv.threadUuid,
										)
									}
								>
									<MessageSquare className="size-3 shrink-0" />
									<span className="flex-1 truncate">
										{conv.title}
									</span>
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-5 shrink-0 opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--sumac)]"
										onClick={(e) => {
											e.stopPropagation()
											handleDeleteConversation(
												conv.uuid,
											)
										}}
									>
										<Trash2 className="size-3" />
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* ── Main Chat Area ──────────────────────────── */}
			<div className="flex flex-1 flex-col min-w-0">
				{/* Header */}
				<div className="shrink-0 flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
					<Button
						variant="ghost"
						size="icon-sm"
						className="shrink-0 text-[var(--muted)] hover:text-[var(--ink)]"
						onClick={() => setSidebarOpen(!sidebarOpen)}
					>
						<ChevronRight
							className={cn(
								'size-4 transition-transform duration-200',
								sidebarOpen && 'rotate-180',
							)}
						/>
					</Button>
					<BookOpen className="size-4 text-[var(--gold)] shrink-0" />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-[var(--ink)] truncate">
							{bookTitle}
						</p>
						<p className="text-xs text-[var(--muted)] truncate">
							{isLoading
								? 'AI is responding…'
								: messages.length > 0
									? `${messages.length} message${messages.length !== 1 ? 's' : ''}`
									: 'Ask the AI to help develop this book'}
						</p>
					</div>
				</div>

				{/* Messages */}
				<div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
					{messages.length === 0 ? (
						<div className="flex h-full items-center justify-center">
							<div className="text-center max-w-md">
								<Bot className="mx-auto size-10 text-[var(--muted)]/40" />
								<p className="mt-3 text-sm font-medium text-[var(--ink)]">
									Book AI Development Assistant
								</p>
								<p className="mt-1 text-xs text-[var(--muted)]">
									I have access to the full content of
									&quot;{bookTitle}&quot;. I can help
									you write, refine, restructure, and
									expand this book. Use the tools to
									update content and generate chapters.
								</p>
								<div className="mt-4 flex flex-wrap justify-center gap-2">
									<span className="rounded-full bg-[var(--gold)]/10 px-2 py-0.5 text-xs text-[var(--gold)]">
										updateBookContent
									</span>
									<span className="rounded-full bg-[var(--sapphire)]/15 px-2 py-0.5 text-xs text-[var(--sapphire)]">
										generateBookChapter
									</span>
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{messages.map((m) => (
								<div key={m.id}>
									<p
										className={cn(
											'mb-1 text-xs font-semibold',
											m.role === 'user'
												? 'text-right text-[var(--muted)]'
												: 'text-left text-[var(--gold)]',
										)}
									>
										{m.role === 'user'
											? 'You'
											: 'Assistant'}
									</p>
									<div
										className={cn(
											'flex',
											m.role === 'user'
												? 'justify-end'
												: 'justify-start',
										)}
									>
										<div
											className={cn(
												'max-w-[85%] space-y-2 px-3 py-2',
												m.role === 'user'
													? 'rounded-xl rounded-br-sm bg-[var(--gold)]/15'
													: 'rounded-xl rounded-bl-sm bg-[var(--surface-soft)]',
											)}
										>
											{m.parts?.map((part, i) => (
												<MessagePart
													key={`${m.id}-${i}`}
													part={part}
													addToolApprovalResponse={
														addToolApprovalResponse
													}
												/>
											))}
										</div>
									</div>
								</div>
							))}
							{isLoading && (
								<div className="flex justify-start">
									<span className="inline-block h-4 w-1 animate-pulse rounded-full bg-[var(--gold)]" />
								</div>
							)}
						</div>
					)}
				</div>

				{/* Input */}
				<div className="shrink-0 border-t border-[var(--line)] p-3">
					<div className="flex items-end gap-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
						<Textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask about this book… (Enter to send, Shift+Enter for new line)"
							disabled={isLoading}
							rows={1}
							className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
						/>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={handleSubmit}
							disabled={isLoading || !input.trim()}
							className="shrink-0 text-[var(--muted)] hover:text-[var(--gold)]"
						>
							<Send className="size-4" />
							<span className="sr-only">Send</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

// ════════════════════════════════════════════════════════════════════
// Sub-components (adapted from ai-chat-drawer.tsx)
// ════════════════════════════════════════════════════════════════════

function MessagePart({
	part,
	addToolApprovalResponse,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	part: any
	addToolApprovalResponse?: (opts: {
		id: string
		approved: boolean
		reason?: string
	}) => void
}) {
	if (part.type === 'text') {
		return (
			<div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
				{part.text}
			</div>
		)
	}

	if (part.type === 'reasoning') {
		return <ReasoningBlock text={part.text ?? ''} />
	}

	if (
		typeof part.type === 'string' &&
		part.type.startsWith('tool-')
	) {
		return (
			<ToolCallCard
				part={part}
				addToolApprovalResponse={addToolApprovalResponse}
			/>
		)
	}

	return null
}

function ReasoningBlock({ text }: { text: string }) {
	const [open, setOpen] = useState(false)

	if (!text) return null

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex w-full items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
				<Brain className="size-3.5 shrink-0" />
				<span>Thinking…</span>
				<ChevronRight
					className={cn(
						'size-3.5 shrink-0 transition-transform duration-200',
						open && 'rotate-90',
					)}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
				<div className="mt-1.5 rounded-md border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2">
					<p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--muted)]">
						{text}
					</p>
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

function ToolCallCard({
	part,
	addToolApprovalResponse,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	part: any
	addToolApprovalResponse?: (opts: {
		id: string
		approved: boolean
		reason?: string
	}) => void
}) {
	const [open, setOpen] = useState(false)
	const toolName = part.type.replace(/^tool-/, '')

	if (part.state === 'approval-requested') {
		return (
			<div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3">
				<div className="mb-2 flex items-center gap-2">
					<Wrench className="size-4 shrink-0 text-[var(--gold)]" />
					<span className="text-sm font-semibold text-[var(--ink)]">
						{toolName}
					</span>
					<span className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-xs font-medium text-[var(--gold)]">
						Approval needed
					</span>
				</div>
				<Collapsible open={open} onOpenChange={setOpen}>
					<CollapsibleTrigger className="flex w-full items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
						<ChevronRight
							className={cn(
								'size-3 shrink-0 transition-transform duration-200',
								open && 'rotate-90',
							)}
						/>
						Parameters
					</CollapsibleTrigger>
					<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
						<pre className="mt-1.5 overflow-x-auto rounded bg-[var(--paper)] px-2 py-1.5 text-xs text-[var(--muted)]">
							{JSON.stringify(part.input ?? {}, null, 2)}
						</pre>
					</CollapsibleContent>
				</Collapsible>
				<div className="mt-3 flex gap-2">
					<Button
						size="sm"
						variant="default"
						className="h-7 bg-[var(--jade)] text-[var(--paper)] hover:bg-[var(--jade)]/80 text-xs"
						onClick={() =>
							addToolApprovalResponse?.({
								id: part.approval?.id,
								approved: true,
							})
						}
					>
						Approve
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="h-7 border-[var(--sumac)]/40 text-[var(--sumac)] hover:bg-[var(--sumac)]/10 text-xs"
						onClick={() =>
							addToolApprovalResponse?.({
								id: part.approval?.id,
								approved: false,
								reason: 'Denied by operator',
							})
						}
					>
						Deny
					</Button>
				</div>
			</div>
		)
	}

	const statusBadge = getToolStatus(part.state)
	const hasDetails =
		part.state === 'input-available' ||
		part.state === 'output-available' ||
		part.state === 'output-error'

	return (
		<div className="rounded-lg border border-[var(--line-soft)] bg-[var(--paper)]/60 p-2.5">
			<Collapsible open={open} onOpenChange={setOpen}>
				<CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-xs">
					<div className="flex items-center gap-2 min-w-0">
						<Wrench className="size-3.5 shrink-0 text-[var(--gold)]" />
						<span className="truncate font-medium text-[var(--ink)]">
							{toolName}
						</span>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{statusBadge && (
							<span
								className={cn(
									'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
									statusBadge.className,
								)}
							>
								{statusBadge.label}
							</span>
						)}
						{hasDetails && (
							<ChevronRight
								className={cn(
									'size-3 shrink-0 text-[var(--muted)] transition-transform duration-200',
									open && 'rotate-90',
								)}
							/>
						)}
					</div>
				</CollapsibleTrigger>
				{hasDetails && (
					<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
						<div className="mt-2 space-y-2">
							{part.input != null && (
								<div>
									<p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
										Parameters
									</p>
									<pre className="overflow-x-auto rounded bg-[var(--paper)] px-2 py-1 text-xs text-[var(--muted)]">
										{JSON.stringify(
											part.input,
											null,
											2,
										)}
									</pre>
								</div>
							)}
							{part.state === 'output-available' &&
								part.output != null && (
									<div>
										<p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
											Result
										</p>
										<pre className="overflow-x-auto rounded bg-[var(--paper)] px-2 py-1 text-xs text-[var(--ink)]">
											{JSON.stringify(
												part.output,
												null,
												2,
											)}
										</pre>
									</div>
								)}
							{part.state === 'output-error' && (
								<div>
									<p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sumac)]">
										Error
									</p>
									<pre className="overflow-x-auto rounded bg-[var(--paper)] px-2 py-1 text-xs text-[var(--sumac)]">
										{part.errorText ??
											'Unknown error'}
									</pre>
								</div>
							)}
						</div>
					</CollapsibleContent>
				)}
			</Collapsible>
		</div>
	)
}

function getToolStatus(
	state: string,
): { label: string; className: string } | null {
	switch (state) {
		case 'input-streaming':
			return {
				label: 'Reading…',
				className: 'bg-[var(--gold)]/10 text-[var(--gold)]',
			}
		case 'input-available':
			return {
				label: 'Running…',
				className:
					'bg-[var(--sapphire)]/15 text-[var(--sapphire)]',
			}
		case 'output-available':
			return {
				label: 'Done',
				className: 'bg-[var(--jade)]/15 text-[var(--jade)]',
			}
		case 'output-error':
			return {
				label: 'Error',
				className: 'bg-[var(--sumac)]/15 text-[var(--sumac)]',
			}
		default:
			return null
	}
}
