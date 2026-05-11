import type { Metadata } from "next";

import { AdminShell } from "@/app/components/portal-ui";
import { CourseStorage } from "@/services/courses-storage";
import { UserStorage } from "@/services/users-storage";
import { EnrollmentForm } from "@/app/admin/enrollments/enrollment-form";

export const metadata: Metadata = {
	title: "Enrollments",
	description: "Add a student to a course manually.",
};

export const runtime = "nodejs";

export default async function EnrollmentsPage() {
	const [users, courses] = await Promise.all([
		UserStorage.list(),
		CourseStorage.list(),
	]);

	return (
		<AdminShell title="Enrollments" description="Manually enroll students in courses.">
			<EnrollmentForm users={users} courses={courses} />
		</AdminShell>
	);
}
