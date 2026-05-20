import { NextResponse } from "next/server";
import { ErrorEventStorage } from "@/services/error-events-storage";
import { getMongoDatabase } from "@/services/mongodb";

export const runtime = "nodejs";

export async function GET() {
	try {
		const db = await getMongoDatabase();
		await db.command({ ping: 1 });
		const recentErrors = await ErrorEventStorage.countSince(
			new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
		);
		return NextResponse.json({
			ok: true,
			db: true,
			timestamp: new Date().toISOString(),
			uptimeSeconds: Math.round(process.uptime()),
			environment: process.env.NODE_ENV ?? "development",
			recentErrors24h: recentErrors,
		});
	} catch {
		return NextResponse.json({ ok: false, db: false }, { status: 503 });
	}
}
