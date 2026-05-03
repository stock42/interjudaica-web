import { NextResponse, type NextRequest } from "next/server";
import { schemaOperatorCreate } from "@/models/operators";
import { OperatorStorage } from "@/services/operators-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const items = await OperatorStorage.list();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = schemaOperatorCreate.parse(await readJson(request));
    const item = await OperatorStorage.create(payload);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
