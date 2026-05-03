import { NextResponse, type NextRequest } from "next/server";
import { schemaPaperCategory } from "@/models/paper-categories";
import { PaperCategoryStorage } from "@/services/paper-categories-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const items = await PaperCategoryStorage.list();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = schemaPaperCategory.parse(await readJson(request));
    const item = await PaperCategoryStorage.create(payload);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
