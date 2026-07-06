import type { Metadata } from 'next'
import { AdminShell } from '@/app/components/portal-ui'
import { UserAccessList, type UserAccessRow } from '@/app/admin/users/user-access-list'
import { CommunityUserStorage } from '@/services/community-users-storage'
import { CourseClassProgressStorage } from '@/services/course-class-progress-storage'
import { CourseEnrollmentStorage } from '@/services/course-enrollments-storage'
import { CoursePaymentStorage } from '@/services/course-payments-storage'
import { CourseStorage } from '@/services/courses-storage'
import { UserStorage } from '@/services/users-storage'

export const metadata: Metadata = {
	title: 'Admin Users',
	description: 'Manage InterJudaica users and student accounts.',
}

export const runtime = 'nodejs'

export default async function AdminUsersPage() {
	const [users, enrollments, payments, courses, communityUsers, progress] =
		await Promise.all([
			UserStorage.list(),
			CourseEnrollmentStorage.list(),
			CoursePaymentStorage.list(),
			CourseStorage.list(),
			CommunityUserStorage.list(),
			CourseClassProgressStorage.list(),
		])
	const courseByUuid = new Map(courses.map(course => [course.uuid, course]))
	const communityByUserUuid = new Map(communityUsers.map(item => [item.userUuid, item]))
	const rows: UserAccessRow[] = users.map(user => {
		const userEnrollments = enrollments.filter(
			enrollment => enrollment.userUuid === user.uuid,
		)
		const userPayments = payments.filter(payment => payment.userUuid === user.uuid)
		const userProgress = progress.filter(item => item.userUuid === user.uuid)
		const lastAccessAt =
			userProgress
				.map(item => item.lastAccessedAt)
				.filter(Boolean)
				.sort()
				.at(-1) ?? ''

		return {
			uuid: user.uuid,
			name: `${user.firstName} ${user.lastName}`.trim(),
			email: user.email,
			location: [user.city, user.state, user.country].filter(Boolean).join(', '),
			status: user.status,
			communityStatus: communityByUserUuid.get(user.uuid)?.status ?? user.communityStatus,
			enrolledCourses: userEnrollments.map(
				enrollment =>
					courseByUuid.get(enrollment.courseUuid)?.title ?? enrollment.courseUuid,
			),
			paymentSources: [
				...new Set([
					...userEnrollments.map(enrollment => enrollment.source),
					...userPayments.map(payment =>
						payment.stripeSessionId ? 'stripe' : payment.status,
					),
				]),
			],
			lastAccessAt,
		}
	})

	return (
		<AdminShell
			title="Users"
			description="Search registered students, inspect course purchases, review community status, and prepare CSV exports."
		>
			<UserAccessList rows={rows} />
		</AdminShell>
	)
}
