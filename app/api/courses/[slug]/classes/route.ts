import { NextResponse } from "next/server";

import { CourseStorage } from "@/services/courses-storage";
import { CourseClassStorage } from "@/services/course-classes-storage";

export const runtime = "nodejs";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const course = await CourseStorage.findPublishedBySlug(slug);

	if (!course) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const items = await CourseClassStorage.listByCourse(course.uuid ?? "");
	return NextResponse.json({ items });
}
