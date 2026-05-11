import { NextResponse, type NextRequest } from "next/server";
import { schemaCoupon } from "@/models/coupons";
import { CouponStorage } from "@/services/coupons-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	const items = await CouponStorage.list();
	return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	try {
		const payload = schemaCoupon.parse(await readJson(request));
		const item = await CouponStorage.create(payload);
		return NextResponse.json({ item }, { status: 201 });
	} catch (error) {
		return routeError(error);
	}
}
