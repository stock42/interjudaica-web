import { NextResponse } from "next/server";

import { RabbiBioStorage } from "@/services/rabbi-bio-storage";

export const runtime = "nodejs";

export async function GET() {
	const item = await RabbiBioStorage.getBySlug("ernesto-yattah");
	return NextResponse.json({ item });
}
