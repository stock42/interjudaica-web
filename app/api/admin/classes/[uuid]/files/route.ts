import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { CourseClassFileStorage } from "@/services/course-class-files-storage";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { requireAdminApi } from "@/app/api/_lib/admin-api";
import { ConfigStorage } from "@/services/config-storage";

export const runtime = "nodejs";

function safeName(originalName: string) {
	return path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	const { uuid } = await params;
	const items = await CourseClassFileStorage.listByClass(uuid);
	return NextResponse.json({ items });
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	const { uuid } = await params;
	const courseClass = await CourseClassStorage.get(uuid);

	if (!courseClass) {
		return NextResponse.json({ error: "Class not found" }, { status: 404 });
	}

  const maxFileSizeMb = await ConfigStorage.getNumber("upload_class_file_max_size_mb");
  const maxFileSize = maxFileSizeMb * 1024 * 1024;

  const formData = await request.formData();
	const file = formData.get("file");
	const title = String(formData.get("title") ?? "");

	if (!(file instanceof File)) {
		return NextResponse.json({ error: "Missing file" }, { status: 400 });
	}

	if (file.size > maxFileSize) {
		return NextResponse.json(
			{ error: `File must be smaller than ${maxFileSize / (1024 * 1024)} MB` },
			{ status: 400 },
		);
	}

	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);
	const sanitized = safeName(file.name);
	const filename = `${randomUUID()}-${sanitized}`;
	const classUuid = courseClass.uuid ?? uuid;
	const uploadDir = path.join(
		process.cwd(),
		"uploads",
		"classes",
		classUuid,
	);
	const filepath = path.join(uploadDir, filename);

	await mkdir(uploadDir, { recursive: true });
	await writeFile(filepath, buffer);

	const item = await CourseClassFileStorage.create({
		courseUuid: courseClass.courseUuid,
		classUuid: courseClass.uuid,
		title,
		originalName: file.name,
		mimeType: file.type,
		size: file.size,
		storagePath: filepath,
	});

	return NextResponse.json({ item }, { status: 201 });
}
