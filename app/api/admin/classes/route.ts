import { NextResponse, type NextRequest } from "next/server";
import { schemaCourseClass } from "@/models/course-classes";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	const courseUuid = request.nextUrl.searchParams.get("courseUuid") ?? "";
	if (!courseUuid) {
		return NextResponse.json(
			{ error: "courseUuid is required" },
			{ status: 400 },
		);
	}

	const items = await CourseClassStorage.listByCourse(courseUuid);
	return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	try {
		const payload = schemaCourseClass.parse(await readJson(request));
		const item = await CourseClassStorage.create(payload);
		return NextResponse.json({ item }, { status: 201 });
	} catch (error) {
		return routeError(error);
	}
}
