import { NextResponse, type NextRequest } from "next/server";
import { schemaCourse } from "@/models/courses";
import { CourseStorage } from "@/services/courses-storage";
import { ForumStorage } from "@/services/forums-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const items = await CourseStorage.list();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = schemaCourse.parse(await readJson(request));
    const item = await CourseStorage.create(payload);
    await ForumStorage.create({
      title: `${item.title} discussion`,
      area: "Course Forum",
      courseSlug: item.slug ?? "",
      createdBy: "system",
      content: "Use this thread to ask questions about the course.",
      status: "open",
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

