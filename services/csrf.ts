import "server-only";

import { randomInt, createHmac } from "crypto";

const CSRF_COOKIE = "__Host-interjudaica_csrf";
const CSRF_HEADER = "x-csrf-token";
const CSRF_MAX_AGE = 60 * 60 * 8;

function getCsrfSecret() {
	return (
		process.env.AUTH_SECRET ??
		process.env.NEXTAUTH_SECRET ??
		"interjudaica-local-development-secret"
	) + "-csrf";
}

export function generateCsrfToken(): string {
	const raw = randomInt(100000, 99999999).toString() + "-" + Date.now();
	const hmac = createHmac("sha256", getCsrfSecret()).update(raw).digest("base64url");
	return `${raw}.${hmac}`;
}

export function verifyCsrfToken(token: string): boolean {
	const [raw, signature] = token.split(".");
	if (!raw || !signature) return false;
	const expected = createHmac("sha256", getCsrfSecret()).update(raw).digest("base64url");
	return expected === signature;
}

export function csrfCookieOptions() {
	return {
		httpOnly: false,
		sameSite: "strict" as const,
		secure: true,
		path: "/",
		maxAge: CSRF_MAX_AGE,
	};
}

export { CSRF_COOKIE, CSRF_HEADER };
