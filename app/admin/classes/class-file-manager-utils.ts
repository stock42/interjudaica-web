import type { TypeCourseClassFile } from '@/models/course-class-files'

export type ClassFileDraft = {
	title: string
	description: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isCourseClassFile(value: unknown): value is TypeCourseClassFile {
	return (
		isRecord(value) &&
		typeof value.uuid === 'string' &&
		typeof value.courseUuid === 'string' &&
		typeof value.classUuid === 'string' &&
		typeof value.originalName === 'string' &&
		typeof value.mimeType === 'string' &&
		typeof value.size === 'number' &&
		typeof value.storagePath === 'string'
	)
}

export async function readJsonObject(
	response: Response,
): Promise<Record<string, unknown>> {
	try {
		const value: unknown = await response.json()
		return isRecord(value) ? value : {}
	} catch (error) {
		if (error instanceof Error) {
			return {}
		}

		throw error
	}
}

export function readJsonObjectFromText(value: string): Record<string, unknown> {
	try {
		const parsed: unknown = JSON.parse(value)
		return isRecord(parsed) ? parsed : {}
	} catch (error) {
		if (error instanceof Error) {
			return {}
		}

		throw error
	}
}

export function uploadFormDataWithProgress({
	url,
	formData,
	onProgress,
}: {
	url: string
	formData: FormData
	onProgress: (value: number) => void
}): Promise<{ status: number; ok: boolean; data: Record<string, unknown> }> {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest()

		request.upload.onprogress = event => {
			if (event.lengthComputable) {
				onProgress(Math.round((event.loaded / event.total) * 100))
			}
		}

		request.onload = () => {
			resolve({
				status: request.status,
				ok: request.status >= 200 && request.status < 300,
				data: readJsonObjectFromText(request.responseText),
			})
		}

		request.onerror = () => {
			reject(new Error('Upload failed'))
		}

		request.open('POST', url)
		request.send(formData)
	})
}

export function getErrorMessage(data: Record<string, unknown>, fallback: string): string {
	return typeof data.error === 'string' ? data.error : fallback
}

export function formatFileSize(size: number): string {
	if (size < 1024) {
		return `${size} B`
	}

	if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(1)} KB`
	}

	return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function createDraft(file: TypeCourseClassFile): ClassFileDraft {
	return {
		title: file.title ?? '',
		description: file.description ?? '',
	}
}

export function buildDrafts(files: TypeCourseClassFile[]) {
	return files.reduce<Record<string, ClassFileDraft>>((drafts, file) => {
		if (file.uuid) {
			drafts[file.uuid] = createDraft(file)
		}

		return drafts
	}, {})
}
