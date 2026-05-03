import { NextResponse, type NextRequest } from "next/server";
import { schemaPaper } from "@/models/papers";
import { PaperStorage } from "@/services/papers-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const { uuid } = await params;
  const item = await PaperStorage.get(uuid);

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { uuid } = await params;
    const payload = schemaPaper.partial().parse(await readJson(request));
    const item = await PaperStorage.update(uuid, payload);

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const { uuid } = await params;
  const deletedCount = await PaperStorage.delete(uuid);

  if (!deletedCount) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}

