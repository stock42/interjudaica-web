import { NextResponse } from "next/server";
import { getMongoDatabase } from "@/services/mongodb";

export const runtime = "nodejs";

export async function GET() {
	try {
		const db = await getMongoDatabase();
		await db.command({ ping: 1 });
		return NextResponse.json({ ok: true, db: true, timestamp: new Date().toISOString() });
	} catch {
		return NextResponse.json({ ok: false, db: false }, { status: 503 });
	}
}
