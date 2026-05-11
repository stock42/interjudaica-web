import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { CommunityUserStorage } from "@/services/community-users-storage";
import { UserStorage } from "@/services/users-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaGrant = z.object({
	userUuid: z.string().uuid(),
});

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	try {
		const payload = schemaGrant.parse(await readJson(request));
		const user = await UserStorage.get(payload.userUuid);
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		await CommunityUserStorage.upsertActive({
			userUuid: payload.userUuid,
		});

		await UserStorage.update(payload.userUuid, {
			communityStatus: "active",
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		return routeError(error);
	}
}
