import { NextResponse, type NextRequest } from "next/server";
import { schemaCourseClass } from "@/models/course-classes";
import { removeStoredCourseClassFile } from "@/services/course-class-file-disk";
import { CourseClassFileStorage } from "@/services/course-class-files-storage";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	const { uuid } = await params;
	const item = await CourseClassStorage.get(uuid);

	if (!item) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ item });
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	try {
		const { uuid } = await params;
		const payload = schemaCourseClass.partial().parse(await readJson(request));
		const item = await CourseClassStorage.update(uuid, payload);

		if (!item) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		return NextResponse.json({ item });
	} catch (error) {
		return routeError(error);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	try {
		const { uuid } = await params;
		const existing = await CourseClassStorage.get(uuid);

		if (!existing) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const files = await CourseClassFileStorage.listByClass(uuid);

		await Promise.all(
			files.map((file) => removeStoredCourseClassFile(file.storagePath)),
		);

		const deletedCount = await CourseClassStorage.delete(uuid);

		if (!deletedCount) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		await CourseClassFileStorage.deleteByClass(uuid);

		return NextResponse.json({ deleted: true });
	} catch (error) {
		return routeError(error);
	}
}
