import { NextResponse, type NextRequest } from "next/server";
import { ConfigStorage } from "@/services/config-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";
import { schemaConfigUpdate } from "@/models/config-schema";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}
	const items = await ConfigStorage.getAll();
	return NextResponse.json({ items });
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}
	try {
		const payload = await readJson(request);
		const parsed = schemaConfigUpdate.safeParse(payload);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
				{ status: 400 },
			);
		}
		for (const [key, value] of Object.entries(parsed.data)) {
			if (value !== undefined) {
				await ConfigStorage.set(key, String(value));
			}
		}
		ConfigStorage.resetCache();
		const items = await ConfigStorage.getAll();
		return NextResponse.json({ items });
	} catch (error) {
		return routeError(error);
	}
}
