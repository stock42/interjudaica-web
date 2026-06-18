import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/app/api/_lib/admin-api";
import { verifyMagicBytes } from "@/lib/magic-bytes";

export const runtime = "nodejs";

const allowedTypes = new Map([
	["application/pdf", "pdf"],
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
	}

	const extension = allowedTypes.get(file.type);

	if (!extension) {
		return NextResponse.json(
			{ error: "Only PDF files are allowed" },
			{ status: 400 },
		);
	}

	if (file.size > MAX_FILE_SIZE) {
		return NextResponse.json(
			{ error: "PDF must be smaller than 50 MB" },
			{ status: 400 },
		);
	}

	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);

	if (!verifyMagicBytes(buffer, file.type)) {
		return NextResponse.json(
			{ error: "File content does not match the claimed PDF type" },
			{ status: 400 },
		);
	}

	const uploadDir = path.join(process.cwd(), "public", "uploads", "books");
	const filename = `book-${Date.now()}-${randomUUID()}.${extension}`;
	const filepath = path.join(uploadDir, filename);

	await mkdir(uploadDir, { recursive: true });
	await writeFile(filepath, buffer);

	return NextResponse.json({ url: `/uploads/books/${filename}` });
}
