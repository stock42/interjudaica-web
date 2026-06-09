import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/app/api/_lib/admin-api";
import { ConfigStorage } from "@/services/config-storage";
import { CourseStorage } from "@/services/courses-storage";
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
  const kind = String(formData.get("kind") ?? "course").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "course";
  const courseUuid = formData.get("courseUuid") as string | null;

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
      { error: `Image must be smaller than ${maxFileSizeMb} MB` },
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
  const uploadDir = path.join(process.cwd(), "public", "uploads", "courses");
  const filename = `${kind}-${Date.now()}-${randomUUID()}.${extension}`;
  const filepath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filepath, buffer);

  const url = `/uploads/courses/${filename}`;

  // If a courseUuid is provided, atomically update the course with the image URL
  if (courseUuid?.trim()) {
    try {
      const imageField = kind === "thumbnail" ? "thumbnailImageUrl" : "coverImageUrl";
      const course = await CourseStorage.get(courseUuid);
      if (course) {
        await CourseStorage.update(courseUuid, { [imageField]: url } as Partial<import("@/models/courses").TypeCourse>);
      }
    } catch {
      // If the course update fails, still return the URL — the client can retry the PATCH
    }
  }

  return NextResponse.json({ url });
}

