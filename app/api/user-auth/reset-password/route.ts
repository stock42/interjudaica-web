import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { sendPasswordResetConfirmation } from "@/lib/send-password-reset-confirmation";
import { PasswordResetAttemptStorage } from "@/services/password-reset-attempts-storage";
import { readJson } from "@/app/api/_lib/admin-api";
import { createRateLimiter } from "@/services/rate-limiter";
import { AuditLogStorage } from "@/services/audit-log-storage";

export const runtime = "nodejs";

const schemaReset = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
	code: z.string().regex(/^\d{6}$/),
	password: z.string().min(8),
});

const resetLimiter = createRateLimiter("reset-password");

export async function POST(request: NextRequest) {
	try {
		const ip =
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		const rateCheck = await resetLimiter.check(ip, 10, 60_000);
		if (!rateCheck.allowed) {
			return NextResponse.json(
				{ error: "Too many attempts" },
				{ status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } },
			);
		}

		const json = await readJson(request);
		const parsed = schemaReset.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = parsed.data;
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

		await resetLimiter.reset(ip);

		await AuditLogStorage.log({
			action: "user.resetPassword.success",
			email: payload.email,
			ip,
			details: "Password reset successfully",
		});

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
		console.error("Reset password error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
