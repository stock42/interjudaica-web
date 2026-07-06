import 'server-only'

import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'

import { BookStorage } from '@/services/books-storage'
import { CourseClassFileStorage } from '@/services/course-class-files-storage'
import { CourseClassStorage } from '@/services/course-classes-storage'
import { CourseStorage } from '@/services/courses-storage'
import { ForumStorage } from '@/services/forums-storage'
import { InstructorStorage } from '@/services/instructors-storage'

export type UploadCleanupCandidate = {
	readonly path: string
	readonly relativePath: string
	readonly size: number
	readonly bucket: string
}

export type UploadCleanupReport = {
	readonly deleted: boolean
	readonly scannedFiles: number
	readonly orphanedFiles: number
	readonly reclaimedBytes: number
	readonly candidates: UploadCleanupCandidate[]
}

type CleanupBucket = {
	readonly label: string
	readonly root: string
	readonly references: ReadonlySet<string>
}

function isMissingDirectory(error: unknown): boolean {
	return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

function publicUploadPath(url: string): string {
	if (!url.startsWith('/uploads/')) {
		return ''
	}

	return path.join(process.cwd(), 'public', url.replace(/^\//, ''))
}

async function collectFiles(root: string): Promise<string[]> {
	let entries
	try {
		entries = await readdir(root, { withFileTypes: true })
	} catch (error) {
		if (isMissingDirectory(error)) {
			return []
		}

		throw error
	}

	const nested = await Promise.all(
		entries.map(async entry => {
			const fullPath = path.join(root, entry.name)
			return entry.isDirectory() ? collectFiles(fullPath) : [fullPath]
		}),
	)

	return nested.flat()
}

function addPublicReference(references: Set<string>, value: string) {
	const fullPath = publicUploadPath(value.trim())
	if (fullPath) {
		references.add(fullPath)
	}
}

async function buildBuckets(): Promise<CleanupBucket[]> {
	const [courses, classes, classFiles, books, instructors, forums] = await Promise.all([
		CourseStorage.list(),
		CourseClassStorage.list(),
		CourseClassFileStorage.list(),
		BookStorage.list(),
		InstructorStorage.list(),
		ForumStorage.list(),
	])
	const courseReferences = new Set<string>()
	const classImageReferences = new Set<string>()
	const bookReferences = new Set<string>()
	const instructorReferences = new Set<string>()
	const forumReferences = new Set<string>()
	const privateClassFileReferences = new Set<string>()

	for (const course of courses) {
		addPublicReference(courseReferences, course.thumbnailImageUrl)
		addPublicReference(courseReferences, course.coverImageUrl)
	}
	for (const courseClass of classes) {
		addPublicReference(classImageReferences, courseClass.imageUrl)
	}
	for (const file of classFiles) {
		privateClassFileReferences.add(file.storagePath)
	}
	for (const book of books) {
		addPublicReference(bookReferences, book.coverUrl)
		addPublicReference(bookReferences, book.filePath)
	}
	for (const instructor of instructors) {
		addPublicReference(instructorReferences, instructor.photoUrl)
	}
	for (const thread of forums) {
		for (const url of [
			...thread.imageUrls,
			...thread.documentUrls,
			...thread.videoUrls,
		]) {
			addPublicReference(forumReferences, url)
		}
	}

	return [
		{
			label: 'course images',
			root: path.join(process.cwd(), 'public', 'uploads', 'courses'),
			references: courseReferences,
		},
		{
			label: 'class images',
			root: path.join(process.cwd(), 'public', 'uploads', 'classes'),
			references: classImageReferences,
		},
		{
			label: 'book assets',
			root: path.join(process.cwd(), 'public', 'uploads', 'books'),
			references: bookReferences,
		},
		{
			label: 'instructor photos',
			root: path.join(process.cwd(), 'public', 'uploads', 'instructors'),
			references: instructorReferences,
		},
		{
			label: 'forum assets',
			root: path.join(process.cwd(), 'public', 'uploads', 'forums'),
			references: forumReferences,
		},
		{
			label: 'private class files',
			root: path.join(process.cwd(), 'uploads', 'classes'),
			references: privateClassFileReferences,
		},
	]
}

export async function runUploadCleanup({
	deleteFiles,
}: {
	deleteFiles: boolean
}): Promise<UploadCleanupReport> {
	const buckets = await buildBuckets()
	const candidates: UploadCleanupCandidate[] = []
	let scannedFiles = 0

	for (const bucket of buckets) {
		const files = await collectFiles(bucket.root)
		scannedFiles += files.length

		for (const filePath of files) {
			if (bucket.references.has(filePath)) {
				continue
			}

			const stats = await stat(filePath)
			candidates.push({
				path: filePath,
				relativePath: path.relative(process.cwd(), filePath),
				size: stats.size,
				bucket: bucket.label,
			})
		}
	}

	if (deleteFiles) {
		await Promise.all(candidates.map(candidate => unlink(candidate.path)))
	}

	return {
		deleted: deleteFiles,
		scannedFiles,
		orphanedFiles: candidates.length,
		reclaimedBytes: candidates.reduce((total, candidate) => total + candidate.size, 0),
		candidates,
	}
}
