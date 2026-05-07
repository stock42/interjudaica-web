import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { sendPasswordResetCode } from "@/lib/send-password-reset-code";
import { readJson, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaForgot = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
});

export async function POST(request: NextRequest) {
	try {
		const payload = schemaForgot.parse(await readJson(request));
		const result = await UserStorage.createPasswordResetCode(payload.email);

		if (result.ok) {
			await sendPasswordResetCode({
				email: result.email,
				firstName: result.firstName,
				code: result.code,
			});
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		return routeError(error);
	}
}
