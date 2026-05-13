import { NextResponse, type NextRequest } from "next/server";
import { schemaUserSignin } from "@/models/users";
import {
	createUserSessionToken,
	userSessionCookieOptions,
	USER_SESSION_COOKIE_NAME,
} from "@/services/user-auth";
import { UserStorage } from "@/services/users-storage";
import { readJson } from "@/app/api/_lib/admin-api";
import { createRateLimiter } from "@/services/rate-limiter";

export const runtime = "nodejs";

const loginLimiter = createRateLimiter("user-login");

export async function POST(request: NextRequest) {
	try {
		const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		const rateCheck = loginLimiter.check(ip, 10, 60_000);
		if (!rateCheck.allowed) {
			return NextResponse.json(
				{ error: "Too many attempts" },
				{ status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } },
			);
		}

		const json = await readJson(request);
		const parsed = schemaUserSignin.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = parsed.data;
		const document = await UserStorage.findByEmail(payload.email);

		if (!document || document.data.status !== "active") {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const user = await UserStorage.authenticate(payload.email, payload.password);

		if (!user) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		loginLimiter.reset(ip);

		const response = NextResponse.json({ user });
		response.cookies.set(
			USER_SESSION_COOKIE_NAME,
			createUserSessionToken(user),
			userSessionCookieOptions(),
		);

		return response;
	} catch (error) {
		console.error("Login error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
