import { NextResponse, type NextRequest } from 'next/server'

import { createFileDownloadResponse } from '@/app/api/_lib/file-download'
import { getClientIp } from '@/app/api/_lib/request-context'
import { AuditLogStorage } from '@/services/audit-log-storage'
import { CourseClassFileStorage } from '@/services/course-class-files-storage'
import { CourseClassProgressStorage } from '@/services/course-class-progress-storage'
import { CourseEnrollmentStorage } from '@/services/course-enrollments-storage'
import { getCurrentUser } from '@/services/user-auth'

export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ fileUuid: string }> },
) {
	const user = await getCurrentUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { fileUuid } = await params
	const file = await CourseClassFileStorage.get(fileUuid)

	if (!file) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	const isEnrolled = await CourseEnrollmentStorage.isEnrolled(user.uuid, file.courseUuid)

	if (!isEnrolled) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const response = await createFileDownloadResponse(file)

	if (response.ok) {
		await Promise.all([
			CourseClassProgressStorage.touch({
				userUuid: user.uuid,
				courseUuid: file.courseUuid,
				classUuid: file.classUuid,
			}),
			AuditLogStorage.log({
				action: 'class_material.student_download',
				actorKind: 'student',
				actorUuid: user.uuid,
				email: user.email,
				ip: getClientIp(request),
				details: `Downloaded ${file.originalName}`,
				subjectType: 'course_class_file',
				subjectUuid: file.uuid ?? '',
				courseUuid: file.courseUuid,
				classUuid: file.classUuid,
			}),
		])
	}

	return response
}
