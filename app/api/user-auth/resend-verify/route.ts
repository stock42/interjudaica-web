import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { readJson } from "@/app/api/_lib/admin-api";
import { sendVerificationEmail } from "@/lib/send-verification-email";

export const runtime = "nodejs";

const schemaResend = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
});

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const rateLimit = new Map<string, RateLimitEntry>();

function getCooldownSeconds() {
	const value = Number(process.env.VERIFY_RESEND_COOLDOWN_SECONDS ?? 30);
	return Number.isFinite(value) && value > 0 ? value : 30;
}

function getRateLimitWindowSeconds() {
	const value = Number(process.env.VERIFY_RESEND_WINDOW_SECONDS ?? 600);
	return Number.isFinite(value) && value > 0 ? value : 600;
}

function getRateLimitMax() {
	const value = Number(process.env.VERIFY_RESEND_LIMIT ?? 3);
	return Number.isFinite(value) && value > 0 ? value : 3;
}

function getClientKey(request: NextRequest) {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		request.headers.get("x-real-ip") ??
		"unknown"
	);
}

function makeKey(prefix: string, value: string) {
	return `${prefix}:${value}`;
}

function checkRateLimit(key: string) {
	const now = Date.now();
	const windowMs = getRateLimitWindowSeconds() * 1000;
	const max = getRateLimitMax();
	const entry = rateLimit.get(key);

	if (!entry || entry.resetAt < now) {
		const next: RateLimitEntry = { count: 1, resetAt: now + windowMs };
		rateLimit.set(key, next);
		return { allowed: true, retryAfter: 0 };
	}

	if (entry.count >= max) {
		const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
		return { allowed: false, retryAfter };
	}

	entry.count += 1;
	rateLimit.set(key, entry);
	return { allowed: true, retryAfter: 0 };
}

export async function POST(request: NextRequest) {
	try {
		const json = await readJson(request);
		const parsed = schemaResend.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = parsed.data;
		const ipLimit = checkRateLimit(makeKey("ip", getClientKey(request)));
		const emailLimit = checkRateLimit(makeKey("email", payload.email));
		const retryAfter = Math.max(ipLimit.retryAfter, emailLimit.retryAfter);

		if (!ipLimit.allowed || !emailLimit.allowed) {
			return NextResponse.json(
				{
					error: "Too many requests",
					retryAfter,
				},
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
