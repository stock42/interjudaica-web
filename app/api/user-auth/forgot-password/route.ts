import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { sendPasswordResetCode } from "@/lib/send-password-reset-code";
import { readJson } from "@/app/api/_lib/admin-api";
import { createRateLimiter } from "@/services/rate-limiter";

export const runtime = "nodejs";

const schemaForgot = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
});

const forgotLimiter = createRateLimiter("forgot-password");

export async function POST(request: NextRequest) {
	try {
		const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		const rateCheck = await forgotLimiter.check(ip, 5, 300_000);
		if (!rateCheck.allowed) {
			return NextResponse.json(
				{ ok: true },
				{ status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 300) } },
			);
		}

		const json = await readJson(request);
		const parsed = schemaForgot.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ ok: true });
		}

		const payload = parsed.data;
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
		console.error("Forgot password error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ ok: true });
	}
}
