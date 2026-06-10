import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

type OperatorRecord = { uuid: string; data: Record<string, unknown> };
type SafeOperator = { uuid: string; email: string; level: number };
type SafeUser = {
	uuid: string;
	email: string;
	firstName: string;
	lastName?: string;
	communityStatus?: string;
};
type CommunityUser = { stripeCustomerId?: string; stripeSubscriptionId?: string };
type CourseRecord = {
	uuid: string;
	title: string;
	price: number;
	status: string;
	summary?: string;
	description?: string;
	startDate?: string;
	zoomLink?: string;
};
type BookRecord = {
	uuid: string;
	slug: string;
	title: string;
	price: number;
	status: string;
	description?: string;
};
type WebhookEventShape = {
	id: string;
	type: string;
	data: {
		object: Record<string, unknown>;
	};
};

const planUuid = "33333333-3333-4333-8333-333333333333";

const state = {
	baseUrl: "https://interjudaica.example",
	operatorRateAllowed: true,
	operatorRetryAfter: 60,
	registerRateAllowed: true,
	registerRetryAfter: 300,
	resetRateAllowed: true,
	resetRetryAfter: 60,
	operatorRecord: null as null | OperatorRecord,
	authenticatedOperator: null as null | SafeOperator,
	operatorResetCalls: [] as string[],
	operatorAuditLogs: [] as unknown[],
	operatorUpdates: [] as Array<{ uuid: string; payload: unknown }>,
	currentUser: null as null | SafeUser,
	communityUser: null as null | CommunityUser,
	planRecord: null as null | Record<string, unknown>,
	portalUrl: "https://billing.stripe.com/session/test",
	portalError: null as null | Error,
	portalArgs: null as null | { customer: string; return_url: string },
	reportedErrors: [] as unknown[],
	registerParseSuccess: true,
	existingUserByEmail: null as null | { uuid: string; data: Record<string, unknown> },
	registeredUser: {
		user: { uuid: "user-1", email: "new@example.com", firstName: "New" },
		verificationCode: "123456",
	} as { user: Record<string, unknown>; verificationCode: string },
	verificationEmails: [] as unknown[],
	resetResult: {
		ok: true,
		user: { uuid: "user-1", firstName: "Cesar" },
	} as { ok: boolean; error?: string; user?: { uuid: string; firstName: string } },
	passwordResetAttempts: [] as unknown[],
	passwordResetConfirmations: [] as unknown[],
	userUpdates: [] as Array<{ uuid: string; payload: unknown }>,
	courseRecord: null as null | CourseRecord,
	couponClaim: null as null | { coupon: { percentOff: number } },
	courseEnrollments: [] as unknown[],
	coursePendingPayments: [] as unknown[],
	coursePaymentEmails: [] as unknown[],
	checkoutSessionId: "cs_test_123",
	checkoutSessionUrl: "https://checkout.stripe.com/pay/cs_test_123",
	checkoutCalls: [] as Array<Record<string, unknown>>,
	retrievedCheckoutSession: {
		mode: "subscription",
		metadata: { community: "true", userUuid: "user-1" },
		status: "complete",
		payment_status: "paid",
		customer: "cus_return",
		subscription: "sub_return",
	} as Record<string, unknown>,
	retrievedSessionIds: [] as string[],
	configNumbers: {
		community_membership_price_cents: 1900,
	},
	configValues: {
		currency: "usd",
	},
	communityUpserts: [] as unknown[],
	bookRecord: null as null | BookRecord,
	bookSales: [] as unknown[],
	bookEmails: [] as unknown[],
	webhookConstructError: null as null | Error,
	webhookEvent: {
		id: "evt_test_1",
		type: "checkout.session.completed",
		data: { object: {} },
	} as WebhookEventShape,
	webhookAlreadyProcessed: false,
	webhookMarkedProcessed: [] as string[],
	webhookCancelledSubscriptions: [] as string[],
};

mock.module("@/models/users", () => ({
	schemaUserSignup: {
		safeParse: (value: unknown) => {
			if (!state.registerParseSuccess) {
				return { success: false, error: {} };
			}
			return { success: true, data: value };
		},
	},
}));

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
	createRateLimiter: (name: string) => ({
		check: async () => {
			if (name === "operator-login") {
				return { allowed: state.operatorRateAllowed, retryAfter: state.operatorRetryAfter };
			}
			if (name === "user-register") {
				return { allowed: state.registerRateAllowed, retryAfter: state.registerRetryAfter };
			}
			if (name === "reset-password") {
				return { allowed: state.resetRateAllowed, retryAfter: state.resetRetryAfter };
			}
			return { allowed: true, retryAfter: 60 };
		},
		reset: async (ip: string) => {
			if (name === "operator-login") {
				state.operatorResetCalls.push(ip);
			}
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

mock.module("@/services/users-storage", () => ({
	UserStorage: {
		findByEmail: async () => state.existingUserByEmail,
		register: async () => state.registeredUser,
		resetPasswordWithCode: async () => state.resetResult,
		update: async (uuid: string, payload: unknown) => {
			state.userUpdates.push({ uuid, payload });
		},
		get: async () => state.currentUser,
		authenticate: async () => state.currentUser,
	},
}));

mock.module("@/lib/send-verification-email", () => ({
	sendVerificationEmail: async (payload: unknown) => {
		state.verificationEmails.push(payload);
	},
}));

mock.module("@/services/password-reset-attempts-storage", () => ({
	PasswordResetAttemptStorage: {
		create: async (payload: unknown) => {
			state.passwordResetAttempts.push(payload);
		},
	},
}));

mock.module("@/lib/send-password-reset-confirmation", () => ({
	sendPasswordResetConfirmation: async (payload: unknown) => {
		state.passwordResetConfirmations.push(payload);
	},
}));

mock.module("@/services/community-users-storage", () => ({
	CommunityUserStorage: {
		getByUserUuid: async () => state.communityUser,
		upsertActive: async (payload: unknown) => {
			state.communityUpserts.push(payload);
			return payload;
		},
		markCancelledBySubscription: async (subscriptionId: string) => {
			state.webhookCancelledSubscriptions.push(subscriptionId);
		},
	},
}));

mock.module("@/services/courses-storage", () => ({
	CourseStorage: {
		get: async () => state.courseRecord,
	},
}));

mock.module("@/services/course-enrollments-storage", () => ({
	CourseEnrollmentStorage: {
		create: async (payload: unknown) => {
			state.courseEnrollments.push(payload);
		},
	},
}));

mock.module("@/services/course-payments-storage", () => ({
	CoursePaymentStorage: {
		createPending: async (payload: unknown) => {
			state.coursePendingPayments.push(payload);
		},
		updateBySession: async () => undefined,
	},
}));

mock.module("server-only", () => ({}));

mock.module("@/services/subscription-plans-storage", () => ({
	SubscriptionPlanStorage: {
		get: async () => state.planRecord,
	},
}));

mock.module("@/services/coupons-storage", () => ({
	CouponStorage: {
		claimCoupon: async () => state.couponClaim,
	},
}));

mock.module("@/services/config-storage", () => ({
	ConfigStorage: {
		getNumber: async (key: keyof typeof state.configNumbers) => state.configNumbers[key],
		get: async (key: keyof typeof state.configValues) => state.configValues[key],
	},
}));

mock.module("@/services/books-storage", () => ({
	BookStorage: {
		get: async () => state.bookRecord,
	},
}));

mock.module("@/services/book-sales-storage", () => ({
	BookSaleStorage: {
		create: async (payload: unknown) => {
			state.bookSales.push(payload);
		},
		markPaid: async () => undefined,
		getBySession: async () => null,
		markFailed: async () => undefined,
	},
}));

mock.module("@/services/webhook-event-storage", () => ({
	WebhookEventStorage: {
		isProcessed: async () => state.webhookAlreadyProcessed,
		markProcessed: async (eventId: string) => {
			state.webhookMarkedProcessed.push(eventId);
		},
	},
}));

mock.module("@/lib/send-course-payment-confirmation", () => ({
	sendCoursePaymentConfirmation: async (payload: unknown) => {
		state.coursePaymentEmails.push(payload);
	},
}));

mock.module("@/lib/send-course-enrollment-email", () => ({
	sendCourseEnrollmentEmail: async () => undefined,
}));

mock.module("@/lib/send-book-payment-confirmation", () => ({
	sendBookPaymentConfirmation: async (payload: unknown) => {
		state.bookEmails.push(payload);
	},
}));

mock.module("@/app/lib/content", () => ({
	formatUsd: (amount: number) => `$${amount.toFixed(2)}`,
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
		checkout: {
			sessions: {
				create: async (payload: Record<string, unknown>) => {
					state.checkoutCalls.push(payload);
					return {
						id: state.checkoutSessionId,
						url: state.checkoutSessionUrl,
					};
				},
				retrieve: async (sessionId: string) => {
					state.retrievedSessionIds.push(sessionId);
					return state.retrievedCheckoutSession;
				},
			},
		},
		webhooks: {
			constructEvent: () => {
				if (state.webhookConstructError) {
					throw state.webhookConstructError;
				}
				return state.webhookEvent;
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
const { POST: registerUser } = await import("@/app/api/user-auth/register/route");
const { POST: resetPassword } = await import("@/app/api/user-auth/reset-password/route");
const { POST: courseCheckout } = await import("@/app/api/checkout/route");
const { POST: communityCheckout } = await import("@/app/api/community/checkout/route");
const { POST: bookCheckout } = await import("@/app/api/books/checkout/route");
const { POST: stripeWebhook } = await import("@/app/api/stripe/webhook/route");
const { routeError } = await import("@/app/api/_lib/admin-api");
const { activateCommunityMembershipFromCheckoutSession } = await import(
	"@/services/community-memberships"
);

describe("route behaviors", () => {
	beforeEach(() => {
		state.baseUrl = "https://interjudaica.example";
		state.operatorRateAllowed = true;
		state.operatorRetryAfter = 60;
		state.registerRateAllowed = true;
		state.registerRetryAfter = 300;
		state.resetRateAllowed = true;
		state.resetRetryAfter = 60;
		state.operatorRecord = null;
		state.authenticatedOperator = null;
		state.operatorResetCalls = [];
		state.operatorAuditLogs = [];
		state.operatorUpdates = [];
		state.currentUser = null;
		state.communityUser = null;
		state.planRecord = null;
		state.portalUrl = "https://billing.stripe.com/session/test";
		state.portalError = null;
		state.portalArgs = null;
		state.reportedErrors = [];
		state.registerParseSuccess = true;
		state.existingUserByEmail = null;
		state.registeredUser = {
			user: { uuid: "user-1", email: "new@example.com", firstName: "New" },
			verificationCode: "123456",
		};
		state.verificationEmails = [];
		state.resetResult = {
			ok: true,
			user: { uuid: "user-1", firstName: "Cesar" },
		};
		state.passwordResetAttempts = [];
		state.passwordResetConfirmations = [];
		state.userUpdates = [];
		state.courseRecord = null;
		state.couponClaim = null;
		state.courseEnrollments = [];
		state.coursePendingPayments = [];
		state.coursePaymentEmails = [];
		state.checkoutSessionId = "cs_test_123";
		state.checkoutSessionUrl = "https://checkout.stripe.com/pay/cs_test_123";
		state.checkoutCalls = [];
		state.retrievedCheckoutSession = {
			mode: "subscription",
			metadata: { community: "true", userUuid: "user-1" },
			status: "complete",
			payment_status: "paid",
			customer: "cus_return",
			subscription: "sub_return",
		};
		state.retrievedSessionIds = [];
		state.configNumbers.community_membership_price_cents = 1900;
		state.configValues.currency = "usd";
		state.communityUpserts = [];
		state.bookRecord = null;
		state.bookSales = [];
		state.bookEmails = [];
		state.webhookConstructError = null;
		state.webhookEvent = {
			id: "evt_test_1",
			type: "checkout.session.completed",
			data: { object: {} },
		};
		state.webhookAlreadyProcessed = false;
		state.webhookMarkedProcessed = [];
		state.webhookCancelledSubscriptions = [];
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
		state.currentUser = { uuid: "user-1", email: "user@example.com", firstName: "Cesar" };
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
		state.currentUser = { uuid: "user-1", email: "user@example.com", firstName: "Cesar" };
		state.communityUser = { stripeCustomerId: "cus_123" };
		state.portalError = new Error("stripe down");

		const response = await customerPortal(new NextRequest("https://interjudaica.example/api/community/customer-portal"));

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("https://interjudaica.example/dashboard?billing=unavailable");
		expect(state.reportedErrors).toHaveLength(1);
	});

	test("register rejects invalid payloads", async () => {
		state.registerParseSuccess = false;
		const request = new NextRequest("https://interjudaica.example/api/user-auth/register", {
			method: "POST",
			body: JSON.stringify({ email: "bad" }),
			headers: { "content-type": "application/json" },
		});

		const response = await registerUser(request);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Invalid payload" });
	});

	test("register rejects duplicate emails", async () => {
		state.existingUserByEmail = { uuid: "user-9", data: { email: "new@example.com" } };
		const request = new NextRequest("https://interjudaica.example/api/user-auth/register", {
			method: "POST",
			body: JSON.stringify({ email: "new@example.com", firstName: "New", password: "supersecret" }),
			headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
		});

		const response = await registerUser(request);

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "Email already registered" });
	});

	test("register creates the user and sends verification email", async () => {
		const request = new NextRequest("https://interjudaica.example/api/user-auth/register", {
			method: "POST",
			body: JSON.stringify({ email: "new@example.com", firstName: "New", password: "supersecret" }),
			headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
		});

		const response = await registerUser(request);
		const body = await response.json();

		expect(response.status).toBe(201);
		expect(body).toEqual({ user: state.registeredUser.user, verificationRequired: true });
		expect(state.verificationEmails).toEqual([
			{ email: "new@example.com", firstName: "New", code: "123456" },
		]);
	});

	test("reset password records failed attempts", async () => {
		state.resetResult = { ok: false, error: "Invalid code" };
		const request = new NextRequest("https://interjudaica.example/api/user-auth/reset-password", {
			method: "POST",
			body: JSON.stringify({ email: "USER@example.com", code: "123456", password: "supersecret" }),
			headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
		});

		const response = await resetPassword(request);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Invalid code" });
		expect(state.passwordResetAttempts).toEqual([
			{ email: "user@example.com", status: "failed", reason: "Invalid code", ip: "1.2.3.4" },
		]);
	});

	test("reset password sends confirmation on success", async () => {
		const request = new NextRequest("https://interjudaica.example/api/user-auth/reset-password", {
			method: "POST",
			body: JSON.stringify({ email: "USER@example.com", code: "123456", password: "supersecret" }),
			headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
		});

		const response = await resetPassword(request);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(state.passwordResetAttempts).toEqual([
			{ email: "user@example.com", userUuid: "user-1", status: "success", reason: "Password updated", ip: "1.2.3.4" },
		]);
		expect(state.passwordResetConfirmations).toEqual([
			{ email: "user@example.com", firstName: "Cesar" },
		]);
	});

	test("course checkout requires an authenticated user", async () => {
		const request = new NextRequest("https://interjudaica.example/api/checkout", {
			method: "POST",
			body: JSON.stringify({ courseUuid: "11111111-1111-4111-8111-111111111111" }),
			headers: { "content-type": "application/json" },
		});

		const response = await courseCheckout(request);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "Unauthorized" });
	});

	test("course checkout grants access immediately for a 100 percent coupon", async () => {
		state.currentUser = {
			uuid: "user-1",
			email: "user@example.com",
			firstName: "Cesar",
		};
		state.courseRecord = {
			uuid: "11111111-1111-4111-8111-111111111111",
			title: "Foundations",
			price: 49,
			status: "published",
		};
		state.couponClaim = { coupon: { percentOff: 100 } };
		const request = new NextRequest("https://interjudaica.example/api/checkout", {
			method: "POST",
			body: JSON.stringify({ courseUuid: state.courseRecord.uuid, couponCode: "free100" }),
			headers: { "content-type": "application/json" },
		});

		const response = await courseCheckout(request);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			url: `https://interjudaica.example/dashboard?payment=success&course=${state.courseRecord.uuid}`,
		});
		expect(state.courseEnrollments).toHaveLength(1);
		expect(state.coursePendingPayments).toHaveLength(1);
		expect(state.checkoutCalls).toHaveLength(0);
		expect(state.coursePaymentEmails).toEqual([
			{ email: "user@example.com", firstName: "Cesar", courseTitle: "Foundations", priceLabel: "$0" },
		]);
	});

	test("community checkout uses the existing Stripe customer when present", async () => {
		state.currentUser = {
			uuid: "user-1",
			email: "user@example.com",
			firstName: "Cesar",
		};
		state.communityUser = { stripeCustomerId: "cus_existing" };
		state.planRecord = { name: "Premium", price: 1900, billingInterval: "month" };
		const request = new NextRequest("https://interjudaica.example/api/community/checkout", {
			method: "POST",
			body: JSON.stringify({ planUuid }),
			headers: { "content-type": "application/json" },
		});

		const response = await communityCheckout(request);
		const body = await response.json();
		const checkoutCall = state.checkoutCalls[0];

		expect(response.status).toBe(200);
		expect(body).toEqual({ url: state.checkoutSessionUrl });
		expect(checkoutCall?.customer).toBe("cus_existing");
		expect(checkoutCall?.customer_email).toBeUndefined();
		expect(checkoutCall?.success_url).toBe(
			"https://interjudaica.example/dashboard?community=success&session_id={CHECKOUT_SESSION_ID}",
		);
	});

	test("community checkout return activates a completed Stripe session", async () => {
		state.currentUser = {
			uuid: "user-1",
			email: "user@example.com",
			firstName: "Cesar",
		};

		const result = await activateCommunityMembershipFromCheckoutSession(
			"cs_test_123",
			"user-1",
		);

		expect(result.ok).toBe(true);
		expect(state.retrievedSessionIds).toEqual(["cs_test_123"]);
		expect(state.communityUpserts).toEqual([
			{
				userUuid: "user-1",
				stripeCustomerId: "cus_return",
				stripeSubscriptionId: "sub_return",
			},
		]);
		expect(state.userUpdates).toEqual([
			{ uuid: "user-1", payload: { communityStatus: "active" } },
		]);
	});

	test("community checkout return rejects sessions for another user", async () => {
		state.currentUser = {
			uuid: "user-1",
			email: "user@example.com",
			firstName: "Cesar",
		};
		state.retrievedCheckoutSession = {
			mode: "subscription",
			metadata: { community: "true", userUuid: "other-user" },
			status: "complete",
			payment_status: "paid",
			customer: "cus_return",
			subscription: "sub_return",
		};

		const result = await activateCommunityMembershipFromCheckoutSession(
			"cs_test_123",
			"user-1",
		);

		expect(result.ok).toBe(false);
		expect(state.communityUpserts).toEqual([]);
		expect(state.userUpdates).toEqual([]);
	});

	test("community checkout activates membership immediately for a 100 percent coupon", async () => {
		state.currentUser = {
			uuid: "user-1",
			email: "user@example.com",
			firstName: "Cesar",
		};
		state.planRecord = { name: "Premium", price: 1900, billingInterval: "month" };
		state.couponClaim = { coupon: { percentOff: 100 } };
		const request = new NextRequest("https://interjudaica.example/api/community/checkout", {
			method: "POST",
			body: JSON.stringify({ planUuid, couponCode: "free100" }),
			headers: { "content-type": "application/json" },
		});

		const response = await communityCheckout(request);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ url: "https://interjudaica.example/dashboard?community=success" });
		expect(state.communityUpserts).toEqual([{ userUuid: "user-1", planUuid }]);
		expect(state.userUpdates).toEqual([{ uuid: "user-1", payload: { communityStatus: "active" } }]);
		expect(state.checkoutCalls).toHaveLength(0);
	});

	test("book checkout returns a direct download URL for free books", async () => {
		state.bookRecord = {
			uuid: "22222222-2222-4222-8222-222222222222",
			slug: "free-book",
			title: "Free Book",
			price: 0,
			status: "published",
		};
		const request = new NextRequest("https://interjudaica.example/api/books/checkout", {
			method: "POST",
			body: JSON.stringify({
				bookUuid: state.bookRecord.uuid,
				firstName: "Cesar",
				lastName: "Casas",
				email: "cesar@example.com",
			}),
			headers: { "content-type": "application/json" },
		});

		const response = await bookCheckout(request);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(String(body.url)).toContain("https://interjudaica.example/api/books/download?token=");
		expect(state.bookSales).toHaveLength(1);
		expect(state.bookEmails).toHaveLength(1);
		expect(state.checkoutCalls).toHaveLength(0);
	});

	test("stripe webhook rejects requests without a signature", async () => {
		const request = new Request("https://interjudaica.example/api/stripe/webhook", {
			method: "POST",
			body: "{}",
			headers: { "content-type": "application/json" },
		});

		const response = await stripeWebhook(request);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Missing signature" });
	});

	test("stripe webhook rejects invalid signatures", async () => {
		state.webhookConstructError = new Error("bad signature");
		process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
		const request = new Request("https://interjudaica.example/api/stripe/webhook", {
			method: "POST",
			body: "{}",
			headers: {
				"content-type": "application/json",
				"stripe-signature": "sig_test",
			},
		});

		const response = await stripeWebhook(request);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Invalid signature" });
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
