import { NextResponse, type NextRequest } from "next/server";
import { schemaPaper } from "@/models/papers";
import { PaperStorage } from "@/services/papers-storage";
import { ForumStorage } from "@/services/forums-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const items = await PaperStorage.list();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = schemaPaper.parse(await readJson(request));
    const item = await PaperStorage.create(payload);
    const existingThread = await ForumStorage.getByPaperUuid(item.uuid ?? "");
    if (!existingThread) {
      await ForumStorage.create({
        title: item.title,
        area: "Community Papers",
        paperUuid: item.uuid ?? "",
        createdBy: "rabbi",
        content: item.summary || "Paper discussion",
        status: "open",
      });
    }
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

