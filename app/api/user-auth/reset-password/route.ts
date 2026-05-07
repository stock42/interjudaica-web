import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { sendPasswordResetConfirmation } from "@/lib/send-password-reset-confirmation";
import { PasswordResetAttemptStorage } from "@/services/password-reset-attempts-storage";
import { readJson, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaReset = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
	code: z.string().regex(/^\d{6}$/),
	password: z.string().min(8),
});

export async function POST(request: NextRequest) {
	try {
		const payload = schemaReset.parse(await readJson(request));
		const ip =
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
		const result = await UserStorage.resetPasswordWithCode(
			payload.email,
			payload.code,
			payload.password,
		);

		if (!result.ok) {
			await PasswordResetAttemptStorage.create({
				email: payload.email,
				status: "failed",
				reason: result.error ?? "Invalid code",
				ip,
			});
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		await PasswordResetAttemptStorage.create({
			email: payload.email,
			userUuid: result.user.uuid,
			status: "success",
			reason: "Password updated",
			ip,
		});

		await sendPasswordResetConfirmation({
			email: payload.email,
			firstName: result.user.firstName,
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		return routeError(error);
	}
}
