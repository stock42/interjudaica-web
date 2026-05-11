import { NextResponse, type NextRequest } from "next/server";

import { PaperStorage } from "@/services/papers-storage";
import { getCurrentUser } from "@/services/user-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const visibility = request.nextUrl.searchParams.get("visibility") ?? "public";
	const allowed = new Set(["public", "community"]);
	if (!allowed.has(visibility)) {
		return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
	}

	if (visibility === "community") {
		const user = await getCurrentUser();
		if (!user || user.communityStatus !== "active") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
	}

	const items = await PaperStorage.listPublishedByVisibility(visibility);
	return NextResponse.json({ items });
}
