import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseStorage } from "@/services/courses-storage";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { CourseClassForm } from "@/app/admin/classes/course-class-form";

export const metadata: Metadata = {
	title: "Edit class",
	description: "Edit a course class session.",
};

export const runtime = "nodejs";

export default async function EditCourseClassPage({
	params,
}: {
	params: Promise<{ courseUuid: string; classUuid: string }>;
}) {
	const { courseUuid, classUuid } = await params;
	const [course, courseClass] = await Promise.all([
		CourseStorage.get(courseUuid),
		CourseClassStorage.get(classUuid),
	]);

	if (!course || !courseClass) {
		notFound();
	}

	return (
		<AdminShell
			title="Edit class"
			description={`Update class details for ${course.title}.`}
		>
			<CourseClassForm course={course} courseClass={courseClass} />
		</AdminShell>
	);
}
