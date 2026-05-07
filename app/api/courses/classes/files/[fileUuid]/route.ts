import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";

import { CourseClassFileStorage } from "@/services/course-class-files-storage";
import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { getCurrentUser } from "@/services/user-auth";

export const runtime = "nodejs";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ fileUuid: string }> },
) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { fileUuid } = await params;
	const file = await CourseClassFileStorage.get(fileUuid);

	if (!file) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const isEnrolled = await CourseEnrollmentStorage.isEnrolled(
		user.uuid,
		file.courseUuid,
	);

	if (!isEnrolled) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		const stats = await stat(file.storagePath);
		const stream = createReadStream(file.storagePath);

		return new NextResponse(stream as unknown as ReadableStream, {
			headers: {
				"Content-Type": file.mimeType || "application/octet-stream",
				"Content-Length": stats.size.toString(),
				"Content-Disposition": `attachment; filename=\"${file.originalName}\"`,
			},
		});
	} catch {
		return NextResponse.json({ error: "File not found" }, { status: 404 });
	}
}
