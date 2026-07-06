import { NextResponse, type NextRequest } from 'next/server'

import { createFileDownloadResponse } from '@/app/api/_lib/file-download'
import { getClientIp } from '@/app/api/_lib/request-context'
import { schemaCourseClassFile } from '@/models/course-class-files'
import { AuditLogStorage } from '@/services/audit-log-storage'
import { removeStoredCourseClassFile } from '@/services/course-class-file-disk'
import { CourseClassFileStorage } from '@/services/course-class-files-storage'
import { readJson, requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

const schemaCourseClassFileMetadataUpdate = schemaCourseClassFile
	.pick({
		title: true,
		description: true,
	})
	.partial()

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string; fileUuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	const { uuid, fileUuid } = await params
	const file = await CourseClassFileStorage.get(fileUuid)

	if (!file || file.classUuid !== uuid) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	const response = await createFileDownloadResponse(file)

	if (response.ok) {
		await AuditLogStorage.log({
			action: 'class_material.admin_download',
			actorKind: 'operator',
			actorUuid: auth.operator.uuid,
			email: auth.operator.email,
			ip: getClientIp(request),
			details: `Downloaded ${file.originalName}`,
			subjectType: 'course_class_file',
			subjectUuid: file.uuid ?? '',
			courseUuid: file.courseUuid,
			classUuid: file.classUuid,
		})
	}

	return response
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string; fileUuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const { uuid, fileUuid } = await params
		const payload = schemaCourseClassFileMetadataUpdate.parse(await readJson(request))
		const existing = await CourseClassFileStorage.get(fileUuid)

		if (!existing || existing.classUuid !== uuid) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		const item = await CourseClassFileStorage.update(fileUuid, payload)

		if (!item) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		await AuditLogStorage.log({
			action: 'class_material.update',
			actorKind: 'operator',
			actorUuid: auth.operator.uuid,
			email: auth.operator.email,
			ip: getClientIp(request),
			details: `Updated ${existing.originalName}`,
			subjectType: 'course_class_file',
			subjectUuid: existing.uuid ?? '',
			courseUuid: existing.courseUuid,
			classUuid: existing.classUuid,
		})

		return NextResponse.json({ item })
	} catch (error) {
		return routeError(error)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string; fileUuid: string }> },
) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const { uuid, fileUuid } = await params
		const file = await CourseClassFileStorage.get(fileUuid)

		if (!file || file.classUuid !== uuid) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		await removeStoredCourseClassFile(file.storagePath)

		const deletedCount = await CourseClassFileStorage.delete(fileUuid)

		if (!deletedCount) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		await AuditLogStorage.log({
			action: 'class_material.delete',
			actorKind: 'operator',
			actorUuid: auth.operator.uuid,
			email: auth.operator.email,
			ip: getClientIp(request),
			details: `Deleted ${file.originalName}`,
			subjectType: 'course_class_file',
			subjectUuid: file.uuid ?? '',
			courseUuid: file.courseUuid,
			classUuid: file.classUuid,
		})

		return NextResponse.json({ deleted: true })
	} catch (error) {
		return routeError(error)
	}
}
