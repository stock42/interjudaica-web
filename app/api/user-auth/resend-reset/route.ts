import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { sendPasswordResetCode } from "@/lib/send-password-reset-code";
import { readJson, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaResend = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
});

const RESEND_COOLDOWN_SECONDS = Number(
	process.env.RESET_RESEND_COOLDOWN_SECONDS ?? "30",
);
const resendCooldowns = new Map<string, number>();

function getCooldownKey(email: string, ip: string | null) {
	return `${email}:${ip ?? "unknown"}`;
}

export async function POST(request: NextRequest) {
	try {
		const payload = schemaResend.parse(await readJson(request));
		const ip =
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
		const key = getCooldownKey(payload.email, ip);
		const now = Date.now();
		const cooldownUntil = resendCooldowns.get(key) ?? 0;

		if (cooldownUntil > now) {
			const retryAfter = Math.ceil((cooldownUntil - now) / 1000);
			return NextResponse.json(
				{
					error: "Cooldown",
					retryAfter,
				},
				{ status: 429 },
			);
		}

		resendCooldowns.set(key, now + RESEND_COOLDOWN_SECONDS * 1000);
		const result = await UserStorage.createPasswordResetCode(payload.email);

		if (result.ok) {
			await sendPasswordResetCode({
				email: result.email,
				firstName: result.firstName,
				code: result.code,
			});
		}

		return NextResponse.json({ ok: true, cooldown: RESEND_COOLDOWN_SECONDS });
	} catch (error) {
		return routeError(error);
	}
}
