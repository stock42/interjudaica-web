import { NextResponse, type NextRequest } from "next/server";

import { ContactStorage } from "@/services/contacts-storage";
import { requireAdminApi } from "@/app/api/_lib/admin-api";

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
	const item = await ContactStorage.get(uuid);

	if (!item) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ item });
}
