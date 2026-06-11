'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react'

type Thread = {
	uuid: string
	userUuid: string
	title: string
	displayTitle: string
	createdAt: string
	updatedAt: string
	messageCount: number
}

interface AiChatHistoryProps {
	threadUuid: string
	onSelectThread: (uuid: string) => void
	onNewChat: () => void
}

function relativeTime(dateStr: string): string {
	const date = new Date(dateStr)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMins / 60)
	const diffDays = Math.floor(diffHours / 24)

	if (diffMins < 1) return 'just now'
	if (diffMins < 60) return `${diffMins}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays < 7) return `${diffDays}d ago`
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	})
}

export default function AiChatHistory({
	threadUuid,
	onSelectThread,
	onNewChat,
}: AiChatHistoryProps) {
	const [threads, setThreads] = useState<Thread[]>([])
	const [loading, setLoading] = useState(true)
	const [deleting, setDeleting] = useState<string | null>(null)
	const [confirmDelete, setConfirmDelete] = useState<Thread | null>(null)

	useEffect(() => {
		let cancelled = false
		async function load() {
			try {
				const res = await fetch('/api/agentes/chats')
				if (!cancelled && res.ok) {
					const data = await res.json()
					setThreads(data.threads || [])
				}
			} catch {
				// silently ignore fetch errors
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [])

	const handleDelete = useCallback(
		async (uuid: string) => {
			setDeleting(uuid)
			try {
				const res = await fetch(`/api/agentes/chats/${uuid}`, {
					method: 'DELETE',
				})
				if (res.ok) {
					setThreads((prev) => prev.filter((t) => t.uuid !== uuid))
					if (uuid === threadUuid) {
						onNewChat()
					}
				}
			} catch {
				// silently ignore
			}
			setDeleting(null)
			setConfirmDelete(null)
		},
		[threadUuid, onNewChat],
	)

	// ── Loading skeleton ──────────────────────────────────────────
	if (loading) {
		return (
			<aside className="flex h-full flex-col border-r border-[var(--line)] bg-[var(--paper)]">
				<div className="p-3">
					<button
						disabled
						className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
					>
						<Loader2 className="size-4 animate-spin" />
						Loading…
					</button>
				</div>
				<div className="flex flex-col gap-px p-2">
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="h-14 animate-pulse rounded-md bg-[var(--surface)]"
						/>
					))}
				</div>
			</aside>
		)
	}

	// ── Main content ──────────────────────────────────────────────
	return (
		<aside className="flex h-full flex-col border-r border-[var(--line)] bg-[var(--paper)]">
			{/* ── Header with New Chat button ─────────────────── */}
			<div className="shrink-0 border-b border-[var(--line)] p-3">
				<button
					onClick={onNewChat}
					className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--gold)] bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#07090c] shadow-[0_8px_20px_rgba(244,189,51,0.16)] transition hover:border-[#ffd66b] hover:bg-[#ffd66b] active:scale-[0.98]"
				>
					<Plus className="size-4" />
					New Chat
				</button>
			</div>

			{/* ── Thread list ─────────────────────────────────── */}
			<div className="flex-1 overflow-y-auto">
				{threads.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
						<MessageSquare className="size-8 text-[var(--muted)]/30" />
						<p className="text-sm text-[var(--muted)]">
							No chat history yet
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-px py-1">
						{threads.map((thread) => {
							const isActive = thread.uuid === threadUuid
							const isDeleting = deleting === thread.uuid

							return (
								<div
									key={thread.uuid}
									className="group relative"
								>
									<button
										onClick={() =>
											onSelectThread(thread.uuid)
										}
										disabled={isDeleting}
										className={`w-full border-l-2 px-4 py-3 text-left transition ${
											isActive
												? 'border-[var(--gold)] bg-[rgba(244,189,51,0.08)]'
												: 'border-transparent hover:bg-[var(--surface)]'
										} ${isDeleting ? 'opacity-40' : ''}`}
									>
										<p
											className={`truncate text-sm ${
												isActive
													? 'font-semibold text-[var(--ink)]'
													: 'font-medium text-[var(--ink)]'
											}`}
										>
											{thread.displayTitle ||
												thread.title}
										</p>
										<div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
											<span>
												{relativeTime(
													thread.updatedAt,
												)}
											</span>
											{thread.messageCount > 0 && (
												<span
													className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
														isActive
															? 'bg-[var(--gold)]/15 text-[var(--gold)]'
															: 'bg-[var(--surface-soft)] text-[var(--muted)]'
													}`}
												>
													{thread.messageCount}
												</span>
											)}
										</div>
									</button>

									{/* Delete button — only visible on hover */}
									<button
										onClick={(e) => {
											e.stopPropagation()
											setConfirmDelete(thread)
										}}
										disabled={isDeleting}
										className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[var(--muted)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--sumac)]/15 hover:text-[var(--sumac)]"
										aria-label={`Delete chat "${thread.displayTitle || thread.title}"`}
									>
										{isDeleting ? (
											<Loader2 className="size-3.5 animate-spin" />
										) : (
											<Trash2 className="size-3.5" />
										)}
									</button>
								</div>
							)
						})}
					</div>
				)}
			</div>

			{/* ── Delete confirmation dialog ──────────────────── */}
			{confirmDelete && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
					onClick={() => setConfirmDelete(null)}
				>
					<div
						className="mx-4 w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
						onClick={(e) => e.stopPropagation()}
					>
						<p className="text-sm leading-relaxed text-[var(--ink)]">
							Delete &ldquo;
							<span className="font-medium">
								{confirmDelete.displayTitle ||
									confirmDelete.title}
							</span>
							&rdquo;? This action cannot be undone.
						</p>
						<div className="mt-5 flex justify-end gap-3">
							<button
								onClick={() => setConfirmDelete(null)}
								className="rounded-md border border-[var(--line-soft)] px-4 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
							>
								Cancel
							</button>
							<button
								onClick={() =>
									handleDelete(confirmDelete.uuid)
								}
								className="rounded-md bg-[var(--sumac)] px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(178,106,34,0.3)] transition hover:bg-[#c47528] active:scale-[0.98]"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</aside>
	)
}
