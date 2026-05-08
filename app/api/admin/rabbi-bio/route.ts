import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { RabbiBioStorage } from "@/services/rabbi-bio-storage";
import { requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaUpdate = z.object({
	title: z.string().trim().min(1),
	markdown: z.string().trim().min(1),
});

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	const item = await RabbiBioStorage.getBySlug("ernesto-yattah");
	return NextResponse.json({ item });
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	try {
		const payload = schemaUpdate.parse(await request.json());
		const item = await RabbiBioStorage.upsertBySlug("ernesto-yattah", payload);
		return NextResponse.json({ item });
	} catch (error) {
		return routeError(error);
	}
}
