import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CourseForm } from '@/app/admin/courses/course-form'
import { CourseMaterialLibrary } from '@/app/admin/courses/course-material-library'
import { AdminShell } from '@/app/components/portal-ui'
import { CourseCategoryStorage } from '@/services/course-categories-storage'
import { CourseClassFileStorage } from '@/services/course-class-files-storage'
import { CourseClassStorage } from '@/services/course-classes-storage'
import { CourseStorage } from '@/services/courses-storage'
import { InstructorStorage } from '@/services/instructors-storage'

export const metadata: Metadata = {
	title: 'Edit Course',
	description: 'Edit an InterJudaica course.',
}

export const runtime = 'nodejs'

export default async function EditCoursePage({
	params,
}: {
	params: Promise<{ uuid: string }>
}) {
	const { uuid } = await params
	const [course, categories, instructors, classes] = await Promise.all([
		CourseStorage.get(uuid),
		CourseCategoryStorage.list(),
		InstructorStorage.list(),
		CourseClassStorage.listByCourse(uuid),
	])

	if (!course) {
		notFound()
	}

	const materialEntries = await Promise.all(
		classes.map(async courseClass => ({
			courseClass,
			files:
				courseClass.uuid ?
					await CourseClassFileStorage.listByClass(courseClass.uuid)
				:	[],
		})),
	)

	return (
		<AdminShell
			title="Edit course"
			description="Update catalog details, pricing, visibility, and student-facing materials."
		>
			<div className="grid gap-6">
				<CourseForm
					categories={categories}
					course={course}
					instructors={instructors}
				/>
				<CourseMaterialLibrary
					course={course}
					materials={materialEntries}
				/>
			</div>
		</AdminShell>
	)
}
