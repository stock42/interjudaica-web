import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { sendPasswordResetCode } from "@/lib/send-password-reset-code";
import { readJson } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaResend = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
});

const RESEND_COOLDOWN_SECONDS = Number(
	process.env.RESET_RESEND_COOLDOWN_SECONDS ?? "60",
);
const RESEND_WINDOW_SECONDS = Number(
	process.env.RESET_RESEND_WINDOW_SECONDS ?? "600",
);
const RESEND_LIMIT = Number(process.env.RESET_RESEND_LIMIT ?? "5");
const resendCooldowns = new Map<string, number>();
const resendWindows = new Map<string, { count: number; start: number }>();

function getCooldownKey(email: string, ip: string | null) {
	return `${email}:${ip ?? "unknown"}`;
}

export async function POST(request: NextRequest) {
	try {
		const json = await readJson(request);
		const parsed = schemaResend.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = parsed.data;
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

		const window = resendWindows.get(key);
		if (window && now - window.start < RESEND_WINDOW_SECONDS * 1000) {
			if (window.count >= RESEND_LIMIT) {
				return NextResponse.json(
					{
						error: "Too many requests",
						retryAfter: RESEND_WINDOW_SECONDS,
					},
					{ status: 429 },
				);
			}
			window.count += 1;
		} else {
			resendWindows.set(key, { count: 1, start: now });
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
