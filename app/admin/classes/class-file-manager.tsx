'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

import { ClassFileCard } from '@/app/admin/classes/class-file-card'
import { ClassFileUploadForm } from '@/app/admin/classes/class-file-upload-form'
import {
	buildDrafts,
	createDraft,
	getErrorMessage,
	isCourseClassFile,
	readJsonObject,
	uploadFormDataWithProgress,
	type ClassFileDraft,
} from '@/app/admin/classes/class-file-manager-utils'
import { Label } from '@/components/ui/label'
import type { TypeCourseClassFile } from '@/models/course-class-files'

type ClassFileManagerProps = {
	courseUuid: string
	classUuid: string
}

export function ClassFileManager({ courseUuid, classUuid }: ClassFileManagerProps) {
	const [files, setFiles] = useState<TypeCourseClassFile[]>([])
	const [drafts, setDrafts] = useState<Record<string, ClassFileDraft>>({})
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [newFileTitle, setNewFileTitle] = useState('')
	const [newFileDescription, setNewFileDescription] = useState('')
	const [loading, setLoading] = useState(true)
	const [uploading, setUploading] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)
	const [savingUuid, setSavingUuid] = useState('')
	const [deletingUuid, setDeletingUuid] = useState('')
	const [error, setError] = useState('')

	useEffect(() => {
		let active = true

		async function loadFiles() {
			setLoading(true)
			setError('')
			const response = await fetch(`/api/admin/classes/${classUuid}/files`)
			const data = await readJsonObject(response)

			if (!active) {
				return
			}

			if (!response.ok) {
				setError(getErrorMessage(data, 'Class files could not be loaded.'))
				setLoading(false)
				return
			}

			const itemsValue = data.items
			const items = Array.isArray(itemsValue) ? itemsValue.filter(isCourseClassFile) : []
			setFiles(items)
			setDrafts(buildDrafts(items))
			setLoading(false)
		}

		loadFiles()

		return () => {
			active = false
		}
	}, [classUuid])

	function updateDraft(uuid: string, field: keyof ClassFileDraft, value: string) {
		setDrafts(current => ({
			...current,
			[uuid]: {
				...(current[uuid] ?? { title: '', description: '' }),
				[field]: value,
			},
		}))
	}

	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		setSelectedFile(event.target.files?.[0] ?? null)
	}

	async function uploadFile(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		if (!selectedFile) {
			setError('Choose a file before uploading.')
			return
		}

		setUploading(true)
		setUploadProgress(0)
		setError('')

		const formData = new FormData()
		formData.set('file', selectedFile)
		formData.set('title', newFileTitle)
		formData.set('description', newFileDescription)

		let uploadResult: {
			status: number
			ok: boolean
			data: Record<string, unknown>
		}

		try {
			uploadResult = await uploadFormDataWithProgress({
				url: `/api/admin/classes/${classUuid}/files`,
				formData,
				onProgress: setUploadProgress,
			})
		} catch (uploadError) {
			setUploading(false)
			setUploadProgress(0)
			setError(
				uploadError instanceof Error ?
					uploadError.message
				:	'The file could not be uploaded.',
			)
			return
		}

		const data = uploadResult.data
		setUploading(false)
		setUploadProgress(100)

		if (uploadResult.status === 401) {
			window.location.assign(`/operator-login?next=/admin/classes/${courseUuid}`)
			return
		}

		if (!uploadResult.ok) {
			setError(getErrorMessage(data, 'The file could not be uploaded.'))
			setUploadProgress(0)
			return
		}

		const uploadedItem = data.item

		if (!isCourseClassFile(uploadedItem)) {
			setError('The uploaded file response was invalid.')
			return
		}

		setFiles(current => [uploadedItem, ...current])
		setDrafts(current => ({
			...current,
			[uploadedItem.uuid ?? '']: createDraft(uploadedItem),
		}))
		setSelectedFile(null)
		setNewFileTitle('')
		setNewFileDescription('')
		setUploadProgress(0)
		event.currentTarget.reset()
	}

	async function saveFile(file: TypeCourseClassFile) {
		if (!file.uuid) {
			return
		}

		setSavingUuid(file.uuid)
		setError('')

		const draft = drafts[file.uuid] ?? createDraft(file)
		const response = await fetch(`/api/admin/classes/${classUuid}/files/${file.uuid}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(draft),
		})
		const data = await readJsonObject(response)
		setSavingUuid('')

		if (response.status === 401) {
			window.location.assign(`/operator-login?next=/admin/classes/${courseUuid}`)
			return
		}

		if (!response.ok) {
			setError(getErrorMessage(data, 'The file details could not be saved.'))
			return
		}

		const updatedItem = data.item

		if (!isCourseClassFile(updatedItem)) {
			setError('The updated file response was invalid.')
			return
		}

		setFiles(current =>
			current.map(item => (item.uuid === updatedItem.uuid ? updatedItem : item)),
		)
		setDrafts(current => ({
			...current,
			[updatedItem.uuid ?? '']: createDraft(updatedItem),
		}))
	}

	async function deleteFile(file: TypeCourseClassFile) {
		if (!file.uuid || !window.confirm(`Remove ${file.originalName}?`)) {
			return
		}

		setDeletingUuid(file.uuid)
		setError('')

		const response = await fetch(`/api/admin/classes/${classUuid}/files/${file.uuid}`, {
			method: 'DELETE',
		})
		const data = await readJsonObject(response)
		setDeletingUuid('')

		if (response.status === 401) {
			window.location.assign(`/operator-login?next=/admin/classes/${courseUuid}`)
			return
		}

		if (!response.ok) {
			setError(getErrorMessage(data, 'The file could not be removed.'))
			return
		}

		setFiles(current => current.filter(item => item.uuid !== file.uuid))
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<Label className="text-base font-semibold text-[var(--ink)]">
						Class materials
					</Label>
					<p className="mt-1 text-sm leading-6 text-[var(--muted)]">
						Upload any file type. Enrolled students download these files from their
						purchased course page.
					</p>
				</div>
				<span className="rounded-md border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-[var(--gold)]">
					{files.length} file{files.length === 1 ? '' : 's'}
				</span>
			</div>

			<ClassFileUploadForm
				selectedFile={selectedFile}
				title={newFileTitle}
				description={newFileDescription}
				uploading={uploading}
				uploadProgress={uploadProgress}
				onFileChange={handleFileChange}
				onTitleChange={setNewFileTitle}
				onDescriptionChange={setNewFileDescription}
				onSubmit={uploadFile}
			/>

			{error ?
				<p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
					{error}
				</p>
			:	null}

			<div className="mt-5 grid gap-3">
				{loading ?
					<p className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
						Loading class materials.
					</p>
				: files.length ?
					files.map(file => {
						const uuid = file.uuid ?? ''
						const draft = drafts[uuid] ?? createDraft(file)

						return (
							<ClassFileCard
								key={uuid}
								classUuid={classUuid}
								file={file}
								draft={draft}
								saving={savingUuid === uuid}
								deleting={deletingUuid === uuid}
								onDraftChange={(field, value) => updateDraft(uuid, field, value)}
								onSave={() => saveFile(file)}
								onDelete={() => deleteFile(file)}
							/>
						)
					})
				:	<p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper)] p-5 text-sm leading-6 text-[var(--muted)]">
						No class materials yet. Add readings, recordings, slides, ZIP files, or any
						other course resource.
					</p>
				}
			</div>
		</section>
	)
}
