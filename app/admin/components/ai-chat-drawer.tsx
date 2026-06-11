'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithApprovalResponses,
} from 'ai'
import { Bot, Send, ChevronRight, Wrench, Brain } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from '@/components/ui/sheet'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface AiChatDrawerProps {
	open: boolean
	onOpenChange: (v: boolean) => void
}

export default function AiChatDrawer({ open, onOpenChange }: AiChatDrawerProps) {
	const {
		messages,
		sendMessage,
		addToolApprovalResponse,
		status,
	} = useChat({
		transport: new DefaultChatTransport({
			api: '/api/agentes/chat',
		}),
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
	})

	const [input, setInput] = useState('')
	const scrollRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// ── Auto-scroll to bottom ──────────────────────────────────────
	const scrollToBottom = useCallback(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [])

	useEffect(() => {
		scrollToBottom()
	}, [messages, scrollToBottom])

	// ── Submit handler ─────────────────────────────────────────────
	const handleSubmit = useCallback(() => {
		const trimmed = input.trim()
		if (!trimmed) return
		sendMessage({ text: trimmed })
		setInput('')
	}, [input, sendMessage])

	// ── Key handler: Enter to send, Shift+Enter for newline ────────
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				handleSubmit()
			}
		},
		[handleSubmit],
	)

	const isLoading = status === 'submitted' || status === 'streaming'

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="!w-full !max-w-full sm:!max-w-full flex flex-col"
			>
				{/* ── Header ─────────────────────────────────────── */}
				<SheetHeader className="shrink-0 border-b border-[var(--line)]">
					<SheetTitle className="text-[var(--ink)] flex items-center gap-2">
						<Bot className="size-5 text-[var(--gold)]" />
						AI Assistant
					</SheetTitle>
					<SheetDescription className="text-[var(--muted)]">
						{isLoading
							? 'AI is responding…'
							: messages.length > 0
								? `${messages.length} message${messages.length !== 1 ? 's' : ''}`
								: 'Ask me to manage courses, users, content, and more'}
					</SheetDescription>
				</SheetHeader>

				{/* ── Messages area ─────────────────────────────── */}
				<div
					ref={scrollRef}
					className="flex-1 overflow-y-auto px-4 py-4"
				>
					{messages.length === 0 ? (
						<div className="flex h-full items-center justify-center">
							<div className="text-center max-w-md">
								<Bot className="mx-auto size-10 text-[var(--muted)]/40" />
								<p className="mt-3 text-sm text-[var(--muted)]">
									I&apos;m your admin AI assistant. I can
									help you manage courses, users, content,
									and more. Try asking me something!
								</p>
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{messages.map((m) => (
								<div key={m.id}>
									{/* Role label */}
									<p
										className={cn(
											'mb-1 text-xs font-semibold',
											m.role === 'user'
												? 'text-right text-[var(--muted)]'
												: 'text-left text-[var(--gold)]',
										)}
									>
										{m.role === 'user' ? 'You' : 'Assistant'}
									</p>

									{/* Message bubble */}
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

							{/* Streaming cursor */}
							{isLoading && (
								<div className="flex justify-start">
									<span className="inline-block h-4 w-1 animate-pulse rounded-full bg-[var(--gold)]" />
								</div>
							)}
						</div>
					)}
				</div>

				{/* ── Input area ─────────────────────────────────── */}
				<div className="shrink-0 border-t border-[var(--line)] p-3">
					<div className="flex items-end gap-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
						<Textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask me something… (Enter to send, Shift+Enter for new line)"
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
			</SheetContent>
		</Sheet>
	)
}

// ════════════════════════════════════════════════════════════════════
// Sub-components
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
	// ── Text part ──────────────────────────────────────────────
	if (part.type === 'text') {
		return (
			<div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
				{part.text}
			</div>
		)
	}

	// ── Reasoning part (R1 / DeepSeek reasoning tokens) ────────
	if (part.type === 'reasoning') {
		return <ReasoningBlock text={part.text ?? ''} />
	}

	// ── Tool part (tool-*) ─────────────────────────────────────
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

	// ── Fallback: unknown part type ────────────────────────────
	return null
}

// ════════════════════════════════════════════════════════════════════
// Reasoning Block (R1 / DeepSeek thinking tokens)
// ════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════
// Tool Call Card (expandable, collapsed by default)
// ════════════════════════════════════════════════════════════════════

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

	// ── Approval requested ─────────────────────────────────────
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

				{/* Parameters */}
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
							{JSON.stringify(
								part.input ?? {},
								null,
								2,
							)}
						</pre>
					</CollapsibleContent>
				</Collapsible>

				{/* Approve / Deny buttons */}
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

	// ── Regular tool call (input/output states) ─────────────────
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
							{/* Input / parameters */}
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

							{/* Output */}
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

							{/* Error */}
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

// ════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════

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
				className: 'bg-[var(--sapphire)]/15 text-[var(--sapphire)]',
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
