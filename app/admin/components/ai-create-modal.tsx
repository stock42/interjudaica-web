'use client'

import {
	useState,
	useRef,
	useEffect,
	useCallback,
	startTransition,
} from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Sparkles, Send, AlertTriangle, FileText } from 'lucide-react'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import SttMicrophone from '@/components/share/stt-microphone'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = 'idle' | 'loading' | 'preview' | 'error' | 'creating'

export interface AiCreateModalProps {
	entityType: string
	entityName: string
	onCreate(data: Record<string, unknown>): Promise<void>
	systemPrompt?: string
	open?: boolean
	onOpenChange?: (open: boolean) => void
	trigger?: React.ReactNode
}

/* ------------------------------------------------------------------ */
/*  Pure helpers (exported for testing)                                */
/* ------------------------------------------------------------------ */

export function buildEntityPrompt(opts: {
	entityType: string
	entityName: string
	systemPrompt?: string
	userInput: string
}): string {
	const parts = [
		`I need to create a new ${opts.entityName} (type: ${opts.entityType}).`,
	]

	if (opts.systemPrompt) {
		parts.push(
			`\nContext and requirements:\n${opts.systemPrompt}`,
		)
	}

	parts.push(`\nMy description:\n${opts.userInput}`)
	parts.push(
		`\nRespond with ONLY a valid JSON object representing the complete ${opts.entityName} data, wrapped in a \`\`\`json code block. No other text.`,
	)

	return parts.join('\n')
}

export function extractJsonFromText(
	text: string,
): Record<string, unknown> | null {
	if (!text) return null

	// Try fenced code block (json or generic)
	const codeMatch = text.match(
		/```(?:json)?\s*\n?([\s\S]*?)\n?```/,
	)
	if (codeMatch) {
		try {
			const parsed = JSON.parse(codeMatch[1].trim())
			if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
				return parsed as Record<string, unknown>
			}
		} catch {
			/* fall through */
		}
	}

	// Try raw JSON object
	const jsonMatch = text.match(/\{[\s\S]*\}/)
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[0])
			if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
				return parsed as Record<string, unknown>
			}
		} catch {
			/* fall through */
		}
	}

	return null
}

export function getMessageText(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	message: { parts?: any[] },
): string {
	if (!message.parts) return ''
	return message.parts
		.filter((p) => p.type === 'text')
		.map((p) => p.text as string)
		.join('\n')
}

export function formatKey(key: string): string {
	return key
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (s) => s.toUpperCase())
		.trim()
}

export function formatValue(
	value: unknown,
	maxLen = 120,
): string {
	if (value === null || value === undefined) return '—'
	if (typeof value === 'boolean') return value ? 'Yes' : 'No'
	if (typeof value === 'number') return String(value)
	if (Array.isArray(value))
		return `${value.length} item${value.length !== 1 ? 's' : ''}`
	if (typeof value === 'object') return '{ … }'
	const s = String(value)
	return s.length > maxLen ? s.slice(0, maxLen) + '…' : s
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AiCreateModal({
	entityType,
	entityName,
	onCreate,
	systemPrompt,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	trigger,
}: AiCreateModalProps) {
	// ── Open state (controlled or uncontrolled) ──────────────────
	const [internalOpen, setInternalOpen] = useState(false)
	const isControlled = controlledOpen !== undefined
	const open = isControlled ? controlledOpen! : internalOpen
	const setOpen = useCallback(
		(v: boolean) => {
			if (isControlled) {
				controlledOnOpenChange?.(v)
			} else {
				setInternalOpen(v)
			}
		},
		[isControlled, controlledOnOpenChange],
	)

	// ── Chat ─────────────────────────────────────────────────────
	const {
		messages,
		sendMessage,
		status,
		error: chatError,
		setMessages,
	} = useChat({
		transport: new DefaultChatTransport({
			api: '/api/agentes/chat',
		}),
	})

	// ── Local UI state ───────────────────────────────────────────
	const [input, setInput] = useState('')
	const [phase, setPhase] = useState<Phase>('idle')
	const [parsedData, setParsedData] = useState<Record<
		string,
		unknown
	> | null>(null)
	const [phaseError, setPhaseError] = useState('')
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const expectingResponse = useRef(false)

	const isLoading = status === 'submitted' || status === 'streaming'
	const isCreating = phase === 'creating'

	// ── Reset everything when the dialog opens ───────────────────
	const prevOpen = useRef(open)
	useEffect(() => {
		if (open && !prevOpen.current) {
			startTransition(() => {
				setMessages([])
				setInput('')
				setPhase('idle')
				setParsedData(null)
				setPhaseError('')
			})
			expectingResponse.current = false
		}
		prevOpen.current = open
	}, [open, setMessages])

	// ── Process AI response when it arrives ──────────────────────
	useEffect(() => {
		if (chatError) {
			startTransition(() => {
				setPhaseError(
					chatError.message || 'An error occurred while communicating with AI',
				)
				setPhase('error')
			})
			expectingResponse.current = false
			return
		}

		if (status !== 'ready' || !expectingResponse.current) return
		expectingResponse.current = false

		const assistantMsgs = messages.filter(
			(m) => m.role === 'assistant',
		)
		if (assistantMsgs.length === 0) {
			startTransition(() => {
				setPhaseError(
					'No response received from AI. Please try again.',
				)
				setPhase('error')
			})
			return
		}

		const last = assistantMsgs[assistantMsgs.length - 1]
		const text = getMessageText(last)

		if (!text.trim()) {
			startTransition(() => {
				setPhaseError(
					'AI returned an empty response. Please try again with more detail.',
				)
				setPhase('error')
			})
			return
		}

		const data = extractJsonFromText(text)
		startTransition(() => {
			if (data) {
				setParsedData(data)
				setPhase('preview')
			} else {
				setPhaseError(
					`AI responded but the output could not be parsed as ${entityName.toLowerCase()} data. Try rephrasing your description.`,
				)
				setPhase('error')
			}
		})
	}, [status, messages, chatError, entityName])

	// ── Send handler ─────────────────────────────────────────────
	const handleSend = useCallback(() => {
		const trimmed = input.trim()
		if (!trimmed || isLoading) return

		setPhase('loading')
		setPhaseError('')
		setParsedData(null)
		expectingResponse.current = true

		const prompt = buildEntityPrompt({
			entityType,
			entityName,
			systemPrompt,
			userInput: trimmed,
		})
		sendMessage({ text: prompt })
	}, [
		input,
		isLoading,
		entityType,
		entityName,
		systemPrompt,
		sendMessage,
	])

	// ── Keyboard: Enter to send ──────────────────────────────────
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				handleSend()
			}
		},
		[handleSend],
	)

	// ── STT transcription callback ───────────────────────────────
	const handleTranscription = useCallback((text: string) => {
		setInput((prev) =>
			prev ? `${prev} ${text}` : text,
		)
	}, [])

	// ── Create handler ───────────────────────────────────────────
	const handleCreate = useCallback(async () => {
		if (!parsedData) return

		setPhase('creating')
		setPhaseError('')

		try {
			await onCreate(parsedData)
			setOpen(false)
		} catch (err) {
			setPhaseError(
				err instanceof Error
					? err.message
					: 'Failed to create entity',
			)
			setPhase('error')
		}
	}, [parsedData, onCreate, setOpen])

	// ── Prevent close during async operations ────────────────────
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (!newOpen && (isLoading || isCreating)) return
			setOpen(newOpen)
		},
		[isLoading, isCreating, setOpen],
	)

	// ── Retry: go back to input ──────────────────────────────────
	const handleRetry = useCallback(() => {
		setPhase('idle')
		setPhaseError('')
		setParsedData(null)
	}, [])

	// ── Render ───────────────────────────────────────────────────
	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{trigger ? (
				<DialogTrigger asChild>{trigger}</DialogTrigger>
			) : null}

			<DialogContent
				className="sm:max-w-lg"
				showCloseButton={!isLoading && !isCreating}
				onInteractOutside={
					isLoading || isCreating
						? (e) => e.preventDefault()
						: undefined
				}
				onEscapeKeyDown={
					isLoading || isCreating
						? (e) => e.preventDefault()
						: undefined
				}
			>
				{/* ── Header ──────────────────────────────── */}
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="size-5 text-[var(--gold)]" />
						Create {entityName}
					</DialogTitle>
					<DialogDescription>
						Describe what you want and AI will generate
						the {entityName.toLowerCase()} data. You can
						review and edit before saving.
					</DialogDescription>
				</DialogHeader>

				{/* ── Preview card ─────────────────────────── */}
				{phase === 'preview' && parsedData && (
					<div className="rounded-lg border border-[var(--gold)]/25 bg-[var(--gold)]/5 p-4">
						<div className="mb-2 flex items-center gap-2">
							<FileText className="size-4 text-[var(--gold)]" />
							<h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">
								Generated {entityName} Data
							</h4>
						</div>
						<PreviewBlock data={parsedData} />
						<p className="mt-3 text-xs text-[var(--muted)]">
							Send another message to refine, or click
							Create to save.
						</p>
					</div>
				)}

				{/* ── Error card ──────────────────────────── */}
				{phase === 'error' && phaseError && (
					<div className="rounded-lg border border-[var(--sumac)]/30 bg-[var(--sumac)]/5 p-4">
						<div className="flex items-start gap-2">
							<AlertTriangle className="size-4 shrink-0 text-[var(--sumac)] mt-0.5" />
							<div>
								<p className="text-sm font-medium text-[var(--sumac)]">
									Generation failed
								</p>
								<p className="mt-1 text-xs text-[var(--muted)]">
									{phaseError}
								</p>
								<Button
									variant="outline"
									size="sm"
									onClick={handleRetry}
									className="mt-2 h-7 text-xs"
								>
									Try again
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* ── Loading indicator ────────────────────── */}
				{phase === 'loading' && (
					<div className="flex items-center justify-center gap-3 py-6">
						<Spinner className="size-5 text-[var(--gold)]" />
						<span className="text-sm text-[var(--muted)]">
							AI is generating your{' '}
							{entityName.toLowerCase()}…
						</span>
					</div>
				)}

				{/* ── Input area (always visible except during create) ── */}
				{phase !== 'creating' && (
					<div className="space-y-3">
						<div className="relative">
							<textarea
								ref={textareaRef}
								value={input}
								onChange={(e) =>
									setInput(e.target.value)
								}
								onKeyDown={handleKeyDown}
								placeholder={`Describe the ${entityName.toLowerCase()} you want to create…`}
								disabled={isLoading}
								rows={4}
								className={cn(
									'w-full resize-y rounded-lg border bg-[var(--surface-soft)] p-3 pr-12 text-sm outline-none transition-colors',
									'border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted)]/50',
									'focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/30',
									'disabled:opacity-50 disabled:cursor-not-allowed',
								)}
							/>
							<div className="absolute bottom-2 right-2">
								<SttMicrophone
									onTranscription={
										handleTranscription
									}
								/>
							</div>
						</div>

						<Button
							onClick={handleSend}
							disabled={isLoading || !input.trim()}
							className="w-full"
						>
							{isLoading ? (
								<>
									<Spinner
										className="mr-2"
										data-icon="inline-start"
									/>
									Generating…
								</>
							) : (
								<>
									<Send
										className="size-4"
										data-icon="inline-start"
									/>
									Send to AI
								</>
							)}
						</Button>
					</div>
				)}

				{/* ── Footer ──────────────────────────────── */}
				<DialogFooter>
					<DialogClose asChild>
						<Button
							variant="outline"
							disabled={isLoading || isCreating}
						>
							Cancel
						</Button>
					</DialogClose>

					{phase === 'preview' && parsedData && (
						<Button
							onClick={handleCreate}
							disabled={isCreating}
							className="bg-[var(--jade)] text-[var(--paper)] hover:bg-[var(--jade)]/80"
						>
							{isCreating ? (
								<>
									<Spinner
										className="mr-2"
										data-icon="inline-start"
									/>
									Creating…
								</>
							) : (
								`Create ${entityName}`
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function PreviewBlock({
	data,
}: {
	data: Record<string, unknown>
}) {
	const entries = Object.entries(data).filter(
		([, v]) => v !== null && v !== undefined,
	)

	if (entries.length === 0) {
		return (
			<p className="text-sm text-[var(--muted)] italic">
				No fields generated
			</p>
		)
	}

	return (
		<div className="space-y-1.5">
			{entries.map(([key, value]) => (
				<div
					key={key}
					className="flex items-start gap-3 text-sm"
				>
					<span className="shrink-0 min-w-[110px] font-medium text-[var(--ink)]">
						{formatKey(key)}
					</span>
					<span className="break-all text-[var(--muted)]">
						{formatValue(value)}
					</span>
				</div>
			))}
		</div>
	)
}
