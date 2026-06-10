import { NextResponse, type NextRequest } from "next/server";
import { verifyCsrfToken, CSRF_COOKIE, CSRF_HEADER } from "@/services/csrf";
import { schemaUserSignin } from "@/models/users";
import {
	createUserSessionToken,
	userSessionCookieOptions,
	USER_SESSION_COOKIE_NAME,
} from "@/services/user-auth";
import { UserStorage } from "@/services/users-storage";
import { readJson } from "@/app/api/_lib/admin-api";
import { createRateLimiter } from "@/services/rate-limiter";
import { AuditLogStorage } from "@/services/audit-log-storage";

export const runtime = "nodejs";

const loginLimiter = createRateLimiter("user-login");

export async function POST(request: NextRequest) {
	try {
		const csrfToken = request.headers.get(CSRF_HEADER) || request.cookies.get(CSRF_COOKIE)?.value
		if (!csrfToken || !verifyCsrfToken(csrfToken)) {
			return NextResponse.json({ error: "CSRF token missing or invalid" }, { status: 403 })
		}

		const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		const rateCheck = await loginLimiter.check(ip, 10, 60_000);
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

		if (document?.data.loginLockedUntil) {
			const lockedUntil = new Date(document.data.loginLockedUntil).getTime();
			if (Date.now() < lockedUntil) {
				const retryAfter = Math.ceil((lockedUntil - Date.now()) / 1000);
				await AuditLogStorage.log({
					action: "user.login.locked",
					email: payload.email,
					ip,
					details: `Account locked until ${document.data.loginLockedUntil}`,
				});
				return NextResponse.json(
					{ error: "Account temporarily locked" },
					{ status: 429, headers: { "Retry-After": String(retryAfter) } },
				);
			}
		}

		if (!document || document.data.status !== "active") {
			await AuditLogStorage.log({
				action: "user.login.failed",
				email: payload.email,
				ip,
				details: "Invalid credentials or inactive account",
			});
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const user = await UserStorage.authenticate(payload.email, payload.password);

		if (!user) {
			if (document) {
				const attempts = (document.data.loginAttempts ?? 0) + 1;
				const updateData: Record<string, unknown> = { loginAttempts: attempts };
				if (attempts >= 5) {
					updateData.loginLockedUntil = new Date(Date.now() + 900000).toISOString();
				}
				await UserStorage.update(document.uuid, updateData as Partial<import("@/models/users").TypeUser>);
			}
			await AuditLogStorage.log({
				action: "user.login.failed",
				email: payload.email,
				ip,
				details: "Invalid credentials",
			});
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		await loginLimiter.reset(ip);

		if (document) {
			await UserStorage.update(document.uuid, {
				loginAttempts: 0,
				loginLockedUntil: "",
			} as Partial<import("@/models/users").TypeUser>);
		}

		await AuditLogStorage.log({
			action: "user.login.success",
			email: payload.email,
			ip,
			details: "Login successful",
		});

		const response = NextResponse.json({ user });
		response.cookies.set(
			USER_SESSION_COOKIE_NAME,
			await createUserSessionToken(user),
			userSessionCookieOptions(),
		);

		return response;
	} catch (error) {
		console.error("Login error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
