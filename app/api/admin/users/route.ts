import { NextResponse, type NextRequest } from "next/server";
import { schemaAdminUser } from "@/models/users";
import { UserStorage } from "@/services/users-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const items = await UserStorage.list();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = schemaAdminUser.parse(await readJson(request));
    const item = await UserStorage.create(payload);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
