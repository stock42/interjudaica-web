import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { readJson } from "@/app/api/_lib/admin-api";
import { sendVerificationEmail } from "@/lib/send-verification-email";
import { createRateLimiter } from "@/services/rate-limiter";

export const runtime = "nodejs";

const schemaResend = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
});

const resendVerifyLimiter = createRateLimiter("resend-verify");

function getCooldownSeconds() {
	const value = Number(process.env.VERIFY_RESEND_COOLDOWN_SECONDS ?? 30);
	return Number.isFinite(value) && value > 0 ? value : 30;
}

function getRateLimitWindowMs() {
	const value = Number(process.env.VERIFY_RESEND_WINDOW_SECONDS ?? 600);
	return (Number.isFinite(value) && value > 0 ? value : 600) * 1000;
}

function getRateLimitMax() {
	const value = Number(process.env.VERIFY_RESEND_LIMIT ?? 3);
	return Number.isFinite(value) && value > 0 ? value : 3;
}

function getClientIp(request: NextRequest) {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		request.headers.get("x-real-ip") ??
		"unknown"
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
		const windowMs = getRateLimitWindowMs();
		const limit = getRateLimitMax();

		const [ipCheck, emailCheck] = await Promise.all([
			resendVerifyLimiter.check(`ip:${ip}`, limit, windowMs),
			resendVerifyLimiter.check(`email:${payload.email}`, limit, windowMs),
		]);

		const retryAfter = Math.max(ipCheck.retryAfter ?? 0, emailCheck.retryAfter ?? 0);

		if (!ipCheck.allowed || !emailCheck.allowed) {
			return NextResponse.json(
				{ error: "Too many requests", retryAfter },
				{ status: 429 },
			);
		}

		const result = await UserStorage.regenerateVerificationCode(payload.email);

		if (!result.ok) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		await sendVerificationEmail({
			email: result.email,
			firstName: result.firstName,
			code: result.code,
		});

		return NextResponse.json({ ok: true, cooldownSeconds: getCooldownSeconds() });
	} catch (error) {
		console.error("Resend verify error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
