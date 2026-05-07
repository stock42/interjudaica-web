import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseStorage } from "@/services/courses-storage";
import { CourseClassForm } from "@/app/admin/classes/course-class-form";

export const metadata: Metadata = {
	title: "New class",
	description: "Create a new class session.",
};

export const runtime = "nodejs";

export default async function NewCourseClassPage({
	params,
}: {
	params: Promise<{ courseUuid: string }>;
}) {
	const { courseUuid } = await params;
	const course = await CourseStorage.get(courseUuid);

	if (!course) {
		notFound();
	}

	return (
		<AdminShell
			title="New class"
			description={`Add a new class for ${course.title}.`}
		>
			<CourseClassForm course={course} />
		</AdminShell>
	);
}
