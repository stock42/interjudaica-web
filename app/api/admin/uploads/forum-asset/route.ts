import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/app/api/_lib/admin-api";
import { ConfigStorage } from "@/services/config-storage";
import { verifyMagicBytes } from "@/lib/magic-bytes";

export const runtime = "nodejs";

const allowedTypes = new Map([
	["image/jpeg", "jpg"],
	["image/png", "png"],
	["image/webp", "webp"],
	["image/gif", "gif"],
]);

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);

	if ("response" in auth) {
		return auth.response;
	}

  const maxFileSizeMb = await ConfigStorage.getNumber("upload_image_max_size_mb");
  const maxFileSize = maxFileSizeMb * 1024 * 1024;

  const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return NextResponse.json({ error: "Missing file" }, { status: 400 });
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
      { error: `File must be smaller than ${maxFileSizeMb} MB` },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (!verifyMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: "File content does not match the claimed image type" },
      { status: 400 },
    );
  }
	const uploadDir = path.join(process.cwd(), "public", "uploads", "forums");
	const filename = `forum-${Date.now()}-${randomUUID()}.${extension}`;
	const filepath = path.join(uploadDir, filename);

	await mkdir(uploadDir, { recursive: true });
	await writeFile(filepath, buffer);

	return NextResponse.json({ url: `/uploads/forums/${filename}` });
}
