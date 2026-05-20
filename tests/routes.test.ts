import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

const state = {
	baseUrl: "https://interjudaica.example",
	operatorRateAllowed: true,
	operatorRetryAfter: 60,
	operatorRecord: null as null | { uuid: string; data: Record<string, unknown> },
	authenticatedOperator: null as null | { uuid: string; email: string; level: number },
	operatorResetCalls: [] as string[],
	operatorAuditLogs: [] as unknown[],
	operatorUpdates: [] as Array<{ uuid: string; payload: unknown }>,
	currentUser: null as null | { uuid: string; email: string },
	communityUser: null as null | { stripeCustomerId?: string },
	portalUrl: "https://billing.stripe.com/session/test",
	portalError: null as null | Error,
	portalArgs: null as null | { customer: string; return_url: string },
	reportedErrors: [] as unknown[],
};

mock.module("@/services/auth", () => ({
	SESSION_COOKIE_NAME: "__Host-interjudaica_operator_session",
	sessionCookieOptions: () => ({ httpOnly: true, sameSite: "strict", secure: true, path: "/", maxAge: 28800 }),
	createOperatorSessionToken: async () => "signed-operator-token",
	authenticateApiRequest: async () => null,
}));

mock.module("@/services/operators-storage", () => ({
	OperatorStorage: {
		findByEmail: async () => state.operatorRecord,
		authenticate: async () => state.authenticatedOperator,
		updateRaw: async (uuid: string, payload: unknown) => {
			state.operatorUpdates.push({ uuid, payload });
		},
	},
}));

mock.module("@/services/rate-limiter", () => ({
	createRateLimiter: () => ({
		check: async () => ({ allowed: state.operatorRateAllowed, retryAfter: state.operatorRetryAfter }),
		reset: async (ip: string) => {
			state.operatorResetCalls.push(ip);
		},
	}),
}));

mock.module("@/services/audit-log-storage", () => ({
	AuditLogStorage: {
		log: async (payload: unknown) => {
			state.operatorAuditLogs.push(payload);
		},
	},
}));

mock.module("@/services/user-auth", () => ({
	getCurrentUser: async () => state.currentUser,
}));

mock.module("@/services/community-users-storage", () => ({
	CommunityUserStorage: {
		getByUserUuid: async () => state.communityUser,
	},
}));

mock.module("@/lib/base-url", () => ({
	getBaseUrl: () => state.baseUrl,
}));

mock.module("@/lib/stripe", () => ({
	getStripe: () => ({
		billingPortal: {
			sessions: {
				create: async ({ customer, return_url }: { customer: string; return_url: string }) => {
					state.portalArgs = { customer, return_url };
					if (state.portalError) {
						throw state.portalError;
					}
					return { url: state.portalUrl };
				},
			},
		},
	}),
}));

mock.module("@/lib/logger", () => ({
	reportError: (payload: unknown) => {
		state.reportedErrors.push(payload);
	},
}));

const { POST: operatorLogin } = await import("@/app/api/auth/login/route");
const { GET: customerPortal } = await import("@/app/api/community/customer-portal/route");
const { routeError } = await import("@/app/api/_lib/admin-api");

describe("route behaviors", () => {
	beforeEach(() => {
		state.baseUrl = "https://interjudaica.example";
		state.operatorRateAllowed = true;
		state.operatorRetryAfter = 60;
		state.operatorRecord = null;
		state.authenticatedOperator = null;
		state.operatorResetCalls = [];
		state.operatorAuditLogs = [];
		state.operatorUpdates = [];
		state.currentUser = null;
		state.communityUser = null;
		state.portalUrl = "https://billing.stripe.com/session/test";
		state.portalError = null;
		state.portalArgs = null;
		state.reportedErrors = [];
	});

	test("operator login returns 400 on invalid JSON body", async () => {
		const request = new NextRequest("https://interjudaica.example/api/auth/login", {
			method: "POST",
			body: "{bad json",
			headers: { "content-type": "application/json" },
		});

		const response = await operatorLogin(request);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Invalid JSON body" });
	});

	test("operator login sets only the operator session cookie on success", async () => {
		state.operatorRecord = { uuid: "op-1", data: { loginAttempts: 1 } };
		state.authenticatedOperator = { uuid: "op-1", email: "admin@example.com", level: 10 };
		const request = new NextRequest("https://interjudaica.example/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ email: "admin@example.com", password: "secret" }),
			headers: { "content-type": "application/json", "x-forwarded-for": "5.6.7.8" },
		});

		const response = await operatorLogin(request);
		const setCookie = response.headers.get("set-cookie") ?? "";

		expect(response.status).toBe(200);
		expect(setCookie).toContain("__Host-interjudaica_operator_session=signed-operator-token");
		expect(setCookie).not.toContain("__Host-interjudaica_csrf");
		expect(state.operatorResetCalls).toEqual(["5.6.7.8"]);
	});

	test("customer portal redirects guests to login", async () => {
		const response = await customerPortal(new NextRequest("https://interjudaica.example/api/community/customer-portal"));

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("https://interjudaica.example/login?next=/dashboard");
	});

	test("customer portal redirects subscribed users to Stripe", async () => {
		state.currentUser = { uuid: "user-1", email: "user@example.com" };
		state.communityUser = { stripeCustomerId: "cus_123" };
		state.portalUrl = "https://billing.stripe.com/session/live";

		const response = await customerPortal(new NextRequest("https://interjudaica.example/api/community/customer-portal"));

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("https://billing.stripe.com/session/live");
		expect(state.portalArgs).toEqual({
			customer: "cus_123",
			return_url: "https://interjudaica.example/dashboard?billing=return",
		});
	});

	test("customer portal logs and falls back when Stripe fails", async () => {
		state.currentUser = { uuid: "user-1", email: "user@example.com" };
		state.communityUser = { stripeCustomerId: "cus_123" };
		state.portalError = new Error("stripe down");

		const response = await customerPortal(new NextRequest("https://interjudaica.example/api/community/customer-portal"));

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("https://interjudaica.example/dashboard?billing=unavailable");
		expect(state.reportedErrors).toHaveLength(1);
	});

	test("routeError maps duplicate key failures to 409", async () => {
		const response = routeError({ code: 11000 });

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "A record with this unique value already exists" });
	});

	test("routeError returns 500 and reports unexpected failures", async () => {
		const response = routeError(new Error("boom"), { event: "route_error_test", route: "/api/test", method: "POST" });

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: "Unexpected server error" });
		expect(state.reportedErrors).toHaveLength(1);
	});
});
