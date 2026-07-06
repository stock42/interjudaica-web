import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminShell, DataTable } from '@/app/components/portal-ui'
import { CommunityUserStorage } from '@/services/community-users-storage'
import { CourseClassProgressStorage } from '@/services/course-class-progress-storage'
import { CourseClassStorage } from '@/services/course-classes-storage'
import { CourseEnrollmentStorage } from '@/services/course-enrollments-storage'
import { CoursePaymentStorage } from '@/services/course-payments-storage'
import { CourseStorage } from '@/services/courses-storage'
import { OperatorStorage } from '@/services/operators-storage'
import { UserStorage } from '@/services/users-storage'

export const metadata: Metadata = {
	title: 'User access diagnostics',
	description: 'Inspect course access, payments, and student activity.',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatDate(value: string): string {
	if (!value) {
		return '-'
	}

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return value
	}

	return date.toLocaleString('en-US')
}

export default async function AdminUserDiagnosticsPage({
	params,
}: {
	params: Promise<{ uuid: string }>
}) {
	const { uuid } = await params
	const user = await UserStorage.get(uuid)

	if (!user) {
		notFound()
	}

	const [enrollments, payments, courses, progress, communityUser, operators] =
		await Promise.all([
			CourseEnrollmentStorage.listAllByUser(uuid),
			CoursePaymentStorage.list(),
			CourseStorage.list(),
			CourseClassProgressStorage.listByUser(uuid),
			CommunityUserStorage.getByUserUuid(uuid),
			OperatorStorage.list(),
		])
	const courseByUuid = new Map(courses.map(course => [course.uuid, course]))
	const operatorByUuid = new Map(operators.map(operator => [operator.uuid, operator]))
	const paymentsByCourse = new Map(
		payments
			.filter(payment => payment.userUuid === uuid)
			.map(payment => [payment.courseUuid, payment]),
	)
	const classesByCourse = new Map(
		await Promise.all(
			enrollments.map(
				async enrollment =>
					[
						enrollment.courseUuid,
						await CourseClassStorage.listByCourse(enrollment.courseUuid),
					] as const,
			),
		),
	)

	return (
		<AdminShell
			title={`${user.firstName} ${user.lastName}`.trim() || user.email}
			description="Course access diagnostics, payment source, manual grants, and last class activity."
		>
			<div className="grid gap-6">
				<section className="grid gap-4 md:grid-cols-3">
					{[
						['Email', user.email],
						['Status', user.status],
						['Community', communityUser?.status ?? user.communityStatus],
					].map(([label, value]) => (
						<div
							key={label}
							className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
						>
							<p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
								{label}
							</p>
							<p className="mt-3 text-sm font-semibold text-[var(--ink)]">{value}</p>
						</div>
					))}
				</section>

				<DataTable
					columns={[
						'Course',
						'Access status',
						'Source',
						'Granted by',
						'Payment',
						'Progress',
						'Last access',
					]}
					rows={
						enrollments.length ?
							enrollments.map(enrollment => {
								const course = courseByUuid.get(enrollment.courseUuid)
								const payment = paymentsByCourse.get(enrollment.courseUuid)
								const courseProgress = progress.filter(
									item => item.courseUuid === enrollment.courseUuid,
								)
								const classes = classesByCourse.get(enrollment.courseUuid) ?? []
								const completed = courseProgress.filter(item => item.completed).length
								const lastAccessAt =
									courseProgress
										.map(item => item.lastAccessedAt)
										.filter(Boolean)
										.sort()
										.at(-1) ?? ''
								const operator =
									enrollment.grantedByOperatorUuid ?
										operatorByUuid.get(enrollment.grantedByOperatorUuid)
									:	null

								return [
									course?.title ?? enrollment.courseUuid,
									enrollment.status,
									enrollment.source,
									operator?.email ?? enrollment.grantedByOperatorEmail ?? '-',
									payment ? `${payment.status} · $${payment.amount.toFixed(2)} USD` : '-',
									`${completed}/${classes.length}`,
									formatDate(lastAccessAt),
								]
							})
						:	[['No course enrollments', '-', '-', '-', '-', '-', '-']]
					}
				/>
			</div>
		</AdminShell>
	)
}
