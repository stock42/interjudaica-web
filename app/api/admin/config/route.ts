import { NextResponse, type NextRequest } from "next/server";
import { ConfigStorage } from "@/services/config-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

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
		const payload = (await readJson(request)) as Record<string, string>;
		for (const [key, value] of Object.entries(payload)) {
			await ConfigStorage.set(key, value);
		}
		ConfigStorage.resetCache();
		const items = await ConfigStorage.getAll();
		return NextResponse.json({ items });
	} catch (error) {
		return routeError(error);
	}
}
