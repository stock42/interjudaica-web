import { NextResponse, type NextRequest } from "next/server";
import { schemaForumThread } from "@/models/forums";
import { ForumStorage } from "@/services/forums-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const items = await ForumStorage.list();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = schemaForumThread.parse(await readJson(request));
    const item = await ForumStorage.create({
      ...payload,
      createdBy: "ernesto",
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

