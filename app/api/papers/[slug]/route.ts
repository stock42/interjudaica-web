import { NextResponse, type NextRequest } from "next/server";

import { PaperStorage } from "@/services/papers-storage";
import { getCurrentUser } from "@/services/user-auth";

export const runtime = "nodejs";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const paper = await PaperStorage.findPublishedBySlug(slug);

	if (!paper) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	if (paper.visibility === "community") {
		const user = await getCurrentUser();
		if (!user || user.communityStatus !== "active") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
	}

	if (paper.visibility === "private") {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({ item: paper });
}
