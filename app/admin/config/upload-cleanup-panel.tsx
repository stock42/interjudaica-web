'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

type UploadCleanupCandidate = {
	readonly relativePath: string
	readonly size: number
	readonly bucket: string
}

type UploadCleanupReport = {
	readonly deleted: boolean
	readonly scannedFiles: number
	readonly orphanedFiles: number
	readonly reclaimedBytes: number
	readonly candidates: UploadCleanupCandidate[]
}

function formatBytes(size: number): string {
	if (size < 1024) {
		return `${size} B`
	}

	if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(1)} KB`
	}

	return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function isCleanupCandidate(value: unknown): value is UploadCleanupCandidate {
	return (
		typeof value === 'object' &&
		value !== null &&
		'relativePath' in value &&
		'size' in value &&
		'bucket' in value &&
		typeof value.relativePath === 'string' &&
		typeof value.size === 'number' &&
		typeof value.bucket === 'string'
	)
}

function isCleanupReport(value: unknown): value is UploadCleanupReport {
	return (
		typeof value === 'object' &&
		value !== null &&
		'deleted' in value &&
		'scannedFiles' in value &&
		'orphanedFiles' in value &&
		'reclaimedBytes' in value &&
		'candidates' in value &&
		typeof value.deleted === 'boolean' &&
		typeof value.scannedFiles === 'number' &&
		typeof value.orphanedFiles === 'number' &&
		typeof value.reclaimedBytes === 'number' &&
		Array.isArray(value.candidates) &&
		value.candidates.every(isCleanupCandidate)
	)
}

export function UploadCleanupPanel() {
	const [report, setReport] = useState<UploadCleanupReport | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	async function runScan(confirm: boolean) {
		setLoading(true)
		setError('')
		const response = await fetch('/api/admin/uploads/cleanup', {
			method: confirm ? 'POST' : 'GET',
			headers: confirm ? { 'Content-Type': 'application/json' } : undefined,
			body: confirm ? JSON.stringify({ confirm: true }) : undefined,
		})
		setLoading(false)

		if (!response.ok) {
			setError('Upload cleanup could not run.')
			return
		}

		const data: unknown = await response.json().catch(() => ({}))
		if (
			typeof data === 'object' &&
			data !== null &&
			'report' in data &&
			isCleanupReport(data.report)
		) {
			setReport(data.report)
		}
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
			<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div>
					<h2 className="font-display text-lg font-semibold text-[var(--ink)]">
						Upload cleanup
					</h2>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
						Scan public upload folders and private class files for files no longer
						referenced by course, class, book, instructor, or forum data.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={loading}
						onClick={() => runScan(false)}
					>
						Scan
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={loading || !report?.orphanedFiles}
						onClick={() => runScan(true)}
					>
						<Trash2 className="h-4 w-4" />
						Delete orphaned files
					</Button>
				</div>
			</div>

			{error ?
				<p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</p>
			:	null}

			{report ?
				<div className="mt-4 grid gap-3">
					<div className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-3">
						<span className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
							{report.scannedFiles} files scanned
						</span>
						<span className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
							{report.orphanedFiles} orphaned files
						</span>
						<span className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
							{formatBytes(report.reclaimedBytes)} reclaimable
						</span>
					</div>
					{report.candidates.length ?
						<div className="max-h-64 overflow-y-auto rounded-md border border-[var(--line)]">
							{report.candidates.slice(0, 50).map(candidate => (
								<div
									key={candidate.relativePath}
									className="grid gap-1 border-t border-[var(--line)] px-3 py-2 text-xs first:border-t-0 sm:grid-cols-[1fr_auto_auto]"
								>
									<span className="text-[var(--ink)]">{candidate.relativePath}</span>
									<span className="text-[var(--muted)]">{candidate.bucket}</span>
									<span className="tabular-nums text-[var(--muted)]">
										{formatBytes(candidate.size)}
									</span>
								</div>
							))}
						</div>
					:	<p className="text-sm text-[var(--muted)]">No orphaned upload files found.</p>}
				</div>
			:	null}
		</section>
	)
}
