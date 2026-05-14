import type { Metadata } from "next";
import { CoursesPageClient } from "./courses-client";
import { listPublicCourses } from "@/app/lib/public-courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Courses",
	description:
		"Browse InterJudaica courses in Jewish thought, Talmud, Hebrew text, and community learning.",
};

export default async function CoursesPage() {
	const courses = await listPublicCourses();

	return <CoursesPageClient courses={courses} />;
}
