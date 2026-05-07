import { unlink } from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";

import { CourseClassFileStorage } from "@/services/course-class-files-storage";
import { requireAdminApi } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string; fileUuid: string }> },
) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	const { fileUuid } = await params;
	const file = await CourseClassFileStorage.get(fileUuid);

	if (!file) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	try {
		await unlink(file.storagePath);
	} catch {
		// ignore missing file on disk
	}

	const deletedCount = await CourseClassFileStorage.delete(fileUuid);

	if (!deletedCount) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ deleted: true });
}
