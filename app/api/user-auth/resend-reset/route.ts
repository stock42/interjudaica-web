import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { sendPasswordResetCode } from "@/lib/send-password-reset-code";
import { readJson } from "@/app/api/_lib/admin-api";
import { createRateLimiter } from "@/services/rate-limiter";

export const runtime = "nodejs";

const schemaResend = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
});

const RESEND_COOLDOWN_SECONDS = Number(
	process.env.RESET_RESEND_COOLDOWN_SECONDS ?? "60",
);
const RESEND_WINDOW_MS =
	Number(process.env.RESET_RESEND_WINDOW_SECONDS ?? "600") * 1000;
const RESEND_LIMIT = Number(process.env.RESET_RESEND_LIMIT ?? "5");

const resendResetLimiter = createRateLimiter("resend-reset");

function getClientIp(request: NextRequest) {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
	);
}

export async function POST(request: NextRequest) {
	try {
		const json = await readJson(request);
		const parsed = schemaResend.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = parsed.data;
		const ip = getClientIp(request);

		const [ipCheck, emailCheck] = await Promise.all([
			resendResetLimiter.check(`ip:${ip}`, RESEND_LIMIT, RESEND_WINDOW_MS),
			resendResetLimiter.check(`email:${payload.email}`, RESEND_LIMIT, RESEND_WINDOW_MS),
		]);

		const retryAfter = Math.max(ipCheck.retryAfter ?? 0, emailCheck.retryAfter ?? 0);

		if (!ipCheck.allowed || !emailCheck.allowed) {
			return NextResponse.json(
				{ error: "Too many requests", retryAfter },
				{ status: 429 },
			);
		}

		const result = await UserStorage.createPasswordResetCode(payload.email);

		if (result.ok) {
			await sendPasswordResetCode({
				email: result.email,
				firstName: result.firstName,
				code: result.code,
			});
		}

		return NextResponse.json({
			ok: true,
			cooldown: RESEND_COOLDOWN_SECONDS,
			cooldownSeconds: RESEND_COOLDOWN_SECONDS,
		});
	} catch (error) {
		console.error("Resend reset error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
