'use client'

import { type ChangeEvent, type FormEvent } from 'react'
import { Upload } from 'lucide-react'

import { adminTextControlClass } from '@/app/admin/components/admin-controls'
import { formatFileSize } from '@/app/admin/classes/class-file-manager-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

type ClassFileUploadFormProps = {
	selectedFile: File | null
	title: string
	description: string
	uploading: boolean
	uploadProgress: number
	onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
	onTitleChange: (value: string) => void
	onDescriptionChange: (value: string) => void
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ClassFileUploadForm({
	selectedFile,
	title,
	description,
	uploading,
	uploadProgress,
	onFileChange,
	onTitleChange,
	onDescriptionChange,
	onSubmit,
}: ClassFileUploadFormProps) {
	return (
		<form
			className="mt-5 grid gap-3 rounded-lg bg-[var(--paper)] p-4"
			onSubmit={onSubmit}
		>
			<div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					File
					<Input
						type="file"
						onChange={onFileChange}
					/>
				</label>
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Title
					<Input
						className={adminTextControlClass}
						placeholder="Optional display title"
						value={title}
						onChange={event => onTitleChange(event.target.value)}
					/>
				</label>
			</div>
			<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
				Description
				<Textarea
					className={adminTextControlClass}
					placeholder="Notes students should see before downloading"
					rows={3}
					value={description}
					onChange={event => onDescriptionChange(event.target.value)}
				/>
			</label>
			<div className="flex flex-wrap items-center gap-3">
				<Button
					type="submit"
					disabled={uploading}
				>
					<Upload className="h-4 w-4" />
					{uploading ? 'Uploading' : 'Upload file'}
				</Button>
				{selectedFile ?
					<span className="text-xs text-[var(--muted)]">
						{selectedFile.name} · {formatFileSize(selectedFile.size)}
					</span>
				:	null}
			</div>
			{uploading ?
				<div
					className="grid gap-2"
					aria-live="polite"
				>
					<Progress value={uploadProgress} />
					<p className="text-xs tabular-nums text-[var(--muted)]">
						Uploading {uploadProgress}%
					</p>
				</div>
			:	null}
		</form>
	)
}
