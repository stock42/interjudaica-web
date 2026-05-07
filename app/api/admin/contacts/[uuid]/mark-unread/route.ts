import { NextResponse, type NextRequest } from "next/server";

import { ContactStorage } from "@/services/contacts-storage";
import { requireAdminApi } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	const { uuid } = await params;
	const updated = await ContactStorage.markUnread(uuid);

	if (!updated?.modifiedCount) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ ok: true });
}
