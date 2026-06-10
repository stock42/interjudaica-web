'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const SIMULATED_TEXT = [
	'Hello!',
	'I am',
	'InterJudaica',
	'AI,',
	'your',
	'assistant',
	'for',
	'Jewish',
	'studies.',
	'How',
	'can',
	'I',
	'help',
	'you',
	'today?',
	'You',
	'can',
	'ask',
	'me',
	'about',
	'courses,',
	'papers,',
	'community,',
	'or',
	'anything',
	'else',
	'related',
	'to',
	'your',
	'learning',
	'journey.',
]

const TOKEN_INTERVAL_MS = 300

export default function AiPrototypePage() {
	const [open, setOpen] = useState(false)
	const [tokens, setTokens] = useState<string[]>([])
	const [simulating, setSimulating] = useState(false)

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const scrollRef = useRef<HTMLDivElement>(null)
	const tokenIndexRef = useRef(0)

	const scrollToBottom = useCallback(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [])

	useEffect(() => {
		scrollToBottom()
	}, [tokens, scrollToBottom])

	const startSimulation = useCallback(() => {
		tokenIndexRef.current = 0
		setTokens([])
		setSimulating(true)

		intervalRef.current = setInterval(() => {
			if (tokenIndexRef.current >= SIMULATED_TEXT.length) {
				if (intervalRef.current) clearInterval(intervalRef.current)
				intervalRef.current = null
				setSimulating(false)
				return
			}
			const next = SIMULATED_TEXT[tokenIndexRef.current]
			tokenIndexRef.current++
			setTokens((prev) => [...prev, next])
		}, TOKEN_INTERVAL_MS)
	}, [])

	const stopSimulation = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}
		setSimulating(false)
	}, [])

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen)
		if (nextOpen) {
			startSimulation()
		} else {
			stopSimulation()
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
			<Sheet open={open} onOpenChange={handleOpenChange}>
				<div className="flex flex-col items-center gap-4">
					<Button
						variant="default"
						size="lg"
						onClick={() => handleOpenChange(true)}
						className="gap-2 text-base"
					>
						<Bot className="size-5" />
						Open AI Assistant
					</Button>
					<p className="text-sm text-[var(--muted)]">
						Click the button to simulate SSE streaming inside a
						Sheet
					</p>
				</div>

				<SheetContent
					side="right"
					className="!w-full !max-w-full sm:!max-w-full flex flex-col"
				>
					<SheetHeader className="shrink-0 border-b border-[var(--line)]">
						<SheetTitle className="text-[var(--ink)] flex items-center gap-2">
							<Bot className="size-5 text-[var(--gold)]" />
							AI Assistant
						</SheetTitle>
						<SheetDescription className="text-[var(--muted)]">
							{simulating
								? 'AI is typing...'
								: tokens.length > 0
									? 'Simulation complete'
									: 'Ask me anything about Jewish studies'}
						</SheetDescription>
					</SheetHeader>

					{/* Message area */}
					<div
						ref={scrollRef}
						className="flex-1 overflow-y-auto px-4 py-4"
					>
						{tokens.length === 0 && !simulating ? (
							<div className="flex h-full items-center justify-center">
								<p className="text-sm text-[var(--muted)]">
									Simulation not started. Close and reopen
									the Sheet to begin.
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{/* User message */}
								{tokens.length > 0 && (
									<div className="flex justify-end">
										<div className="max-w-[80%] rounded-xl rounded-br-sm bg-[var(--gold)]/15 px-3 py-2">
											<p className="text-sm text-[var(--ink)]">
												Tell me about InterJudaica&apos;s
												courses
											</p>
										</div>
									</div>
								)}

								{/* AI response */}
								<div className="flex justify-start">
									<div
										className={cn(
											'max-w-[85%] rounded-xl rounded-bl-sm bg-[var(--surface-soft)] px-3 py-2',
										)}
									>
										<div className="text-sm leading-relaxed text-[var(--ink)]">
											{tokens.map((token, i) => (
												<span key={i}>{token} </span>
											))}
											{simulating && (
												<span className="inline-block h-4 w-1 animate-pulse bg-[var(--gold)] align-middle" />
											)}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Input area */}
					<div className="shrink-0 border-t border-[var(--line)] p-3">
						<div className="flex items-center gap-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
							<input
								type="text"
								disabled
								placeholder="Type your question..."
								className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 outline-none"
							/>
							<Button
								variant="ghost"
								size="icon-sm"
								disabled
								className="text-[var(--muted)]"
							>
								<Send className="size-4" />
							</Button>
						</div>
						<p className="mt-2 text-center text-xs text-[var(--muted)]">
							Simulated SSE streaming prototype — input is
							read-only
						</p>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	)
}
