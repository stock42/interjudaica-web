import { NextResponse, type NextRequest } from "next/server";

import { ContactStorage } from "@/services/contacts-storage";
import { requireAdminApi } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	const items = await ContactStorage.list();
	return NextResponse.json({ items });
}
