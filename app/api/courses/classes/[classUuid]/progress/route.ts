import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { CourseClassProgressStorage } from '@/services/course-class-progress-storage'
import { CourseClassStorage } from '@/services/course-classes-storage'
import { CourseEnrollmentStorage } from '@/services/course-enrollments-storage'
import { getCurrentUser } from '@/services/user-auth'
import { readJson, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

const schemaProgressUpdate = z.object({
	completed: z.coerce.boolean(),
})

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ classUuid: string }> },
) {
	const user = await getCurrentUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { classUuid } = await params
	const courseClass = await CourseClassStorage.get(classUuid)
	if (!courseClass) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	const isEnrolled = await CourseEnrollmentStorage.isEnrolled(
		user.uuid,
		courseClass.courseUuid,
	)
	if (!isEnrolled) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const item = await CourseClassProgressStorage.getByUserClass(user.uuid, classUuid)
	return NextResponse.json({ item })
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ classUuid: string }> },
) {
	const user = await getCurrentUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { classUuid } = await params
		const payload = schemaProgressUpdate.parse(await readJson(request))
		const courseClass = await CourseClassStorage.get(classUuid)
		if (!courseClass) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		const isEnrolled = await CourseEnrollmentStorage.isEnrolled(
			user.uuid,
			courseClass.courseUuid,
		)
		if (!isEnrolled) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const item = await CourseClassProgressStorage.setCompleted({
			userUuid: user.uuid,
			courseUuid: courseClass.courseUuid,
			classUuid,
			completed: payload.completed,
		})

		return NextResponse.json({ item })
	} catch (error) {
		return routeError(error)
	}
}
