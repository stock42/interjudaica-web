import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
	createUserSessionToken,
	userSessionCookieOptions,
	USER_SESSION_COOKIE_NAME,
} from "@/services/user-auth";
import { UserStorage } from "@/services/users-storage";
import { readJson } from "@/app/api/_lib/admin-api";
import { sendWelcomeEmail } from "@/lib/send-welcome-email";
import { createRateLimiter } from "@/services/rate-limiter";

export const runtime = "nodejs";

const schemaVerify = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
	code: z.string().regex(/^\d{6}$/),
});

const verifyLimiter = createRateLimiter("user-verify");

export async function POST(request: NextRequest) {
	try {
		const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		const rateCheck = verifyLimiter.check(ip, 10, 60_000);
		if (!rateCheck.allowed) {
			return NextResponse.json(
				{ error: "Too many attempts" },
				{ status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } },
			);
		}

		const json = await readJson(request);
		const parsed = schemaVerify.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = parsed.data;
		const result = await UserStorage.verifyEmailCode(
			payload.email,
			payload.code,
		);

		if (!result.ok) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		verifyLimiter.reset(ip);

		const response = NextResponse.json({ user: result.user });
		response.cookies.set(
			USER_SESSION_COOKIE_NAME,
			createUserSessionToken(result.user),
			userSessionCookieOptions(),
		);

		await sendWelcomeEmail({
			email: result.user.email,
			firstName: result.user.firstName,
		});

		return response;
	} catch (error) {
		console.error("Verify error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
