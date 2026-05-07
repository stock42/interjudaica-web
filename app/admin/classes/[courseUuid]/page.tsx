import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { CourseStorage } from "@/services/courses-storage";
import { CourseClassList } from "@/app/admin/classes/course-class-list";

export const metadata: Metadata = {
	title: "Course classes",
	description: "Manage class sessions for a course.",
};

export const runtime = "nodejs";

export default async function CourseClassesPage({
	params,
}: {
	params: Promise<{ courseUuid: string }>;
}) {
	const { courseUuid } = await params;
	const [course, classes] = await Promise.all([
		CourseStorage.get(courseUuid),
		CourseClassStorage.listByCourse(courseUuid),
	]);

	if (!course) {
		notFound();
	}

	return (
		<AdminShell
			title={`Classes · ${course.title}`}
			description="Create and manage course class sessions."
		>
			<CourseClassList course={course} classes={classes} />
		</AdminShell>
	);
}
