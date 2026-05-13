import { NextResponse, type NextRequest } from "next/server";
import { schemaBook } from "@/models/books";
import { BookStorage } from "@/services/books-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}
	const items = await BookStorage.list();
	return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}
	try {
		const payload = schemaBook.parse(await readJson(request));
		const item = await BookStorage.create(payload);
		return NextResponse.json({ item }, { status: 201 });
	} catch (error) {
		return routeError(error);
	}
}
