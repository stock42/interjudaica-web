import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const allowedTypes = new Map([
	["image/jpeg", "jpg"],
	["image/png", "png"],
	["image/webp", "webp"],
	["image/gif", "gif"],
]);
const maxFileSize = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return NextResponse.json({ error: "Missing image file" }, { status: 400 });
	}

	const extension = allowedTypes.get(file.type);

	if (!extension) {
		return NextResponse.json(
			{ error: "Only JPG, PNG, WEBP, and GIF images are allowed" },
			{ status: 400 },
		);
	}

	if (file.size > maxFileSize) {
		return NextResponse.json(
			{ error: "Image must be smaller than 5 MB" },
			{ status: 400 },
		);
	}

	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);
	const uploadDir = path.join(process.cwd(), "public", "uploads", "books");
	const filename = `book-${Date.now()}-${randomUUID()}.${extension}`;
	const filepath = path.join(uploadDir, filename);

	await mkdir(uploadDir, { recursive: true });
	await writeFile(filepath, buffer);

	return NextResponse.json({ url: `/uploads/books/${filename}` });
}
