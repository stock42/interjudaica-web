import { NextResponse, type NextRequest } from "next/server";
import { verifyCsrfToken, CSRF_COOKIE, CSRF_HEADER } from "@/services/csrf";
import { schemaUserSignup } from "@/models/users";
import { UserStorage } from "@/services/users-storage";
import { readJson } from "@/app/api/_lib/admin-api";
import { sendVerificationEmail } from "@/lib/send-verification-email";
import { createRateLimiter } from "@/services/rate-limiter";
import { AuditLogStorage } from "@/services/audit-log-storage";

export const runtime = "nodejs";

const registerLimiter = createRateLimiter("user-register");

export async function POST(request: NextRequest) {
	try {
		const csrfToken = request.headers.get(CSRF_HEADER) || request.cookies.get(CSRF_COOKIE)?.value
		if (!csrfToken || !verifyCsrfToken(csrfToken)) {
			return NextResponse.json({ error: "CSRF token missing or invalid" }, { status: 403 })
		}

		const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		const rateCheck = await registerLimiter.check(ip, 5, 300_000);
		if (!rateCheck.allowed) {
			return NextResponse.json(
				{ error: "Too many registration attempts" },
				{ status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 300) } },
			);
		}

		const json = await readJson(request);
		const parsed = schemaUserSignup.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = parsed.data;
		const existing = await UserStorage.findByEmail(payload.email);

		if (existing) {
			return NextResponse.json(
				{ error: "Email already registered" },
				{ status: 409 },
			);
		}

		const { user, verificationCode } = await UserStorage.register(payload);

		await AuditLogStorage.log({
			action: "user.register",
			email: payload.email,
			ip,
			details: "Registration successful",
		});

		await sendVerificationEmail({
			email: payload.email,
			firstName: payload.firstName,
			code: verificationCode,
		});

		return NextResponse.json(
			{ user, verificationRequired: true },
			{ status: 201 },
		);
	} catch (error) {
		console.error("Register error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
