import type { Metadata } from "next";
import { CoursesPageClient } from "./courses-client";
import { listPublicCourses } from "@/app/lib/public-courses";
import {
	PageShell,
	Section,
	SectionIntro,
} from "@/app/components/portal-ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Courses",
	description:
		"Browse InterJudaica courses in Jewish thought, Talmud, Hebrew text, and community learning.",
};

export default async function CoursesPage() {
	const courses = await listPublicCourses();

	return (
		<PageShell>
			<Section tone="transparent">
				<SectionIntro
					eyebrow="All courses"
					title="Live and self-paced Jewish learning"
					text="Filter by price, level, and start date, then open a course page for editions, samples, pricing, and the private forum path."
				/>
				<CoursesPageClient courses={courses} />
			</Section>
		</PageShell>
	);
}
