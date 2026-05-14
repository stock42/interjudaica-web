import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/services/user-auth";
import { UserStorage } from "@/services/users-storage";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json() as { emailNotifications?: boolean };
		if (typeof body.emailNotifications === "boolean") {
			await UserStorage.update(user.uuid, {
				emailNotifications: body.emailNotifications,
			} as Partial<import("@/models/users").TypeUser>);
		}
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
