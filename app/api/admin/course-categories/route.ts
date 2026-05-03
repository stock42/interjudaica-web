import { NextResponse, type NextRequest } from "next/server";
import { schemaCourseCategory } from "@/models/course-categories";
import { CourseCategoryStorage } from "@/services/course-categories-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const items = await CourseCategoryStorage.list();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = schemaCourseCategory.parse(await readJson(request));
    const item = await CourseCategoryStorage.create(payload);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

