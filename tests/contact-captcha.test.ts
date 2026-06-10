import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";

import type { POST as POSTType } from "@/app/api/contact/route";

mock.module("server-only", () => ({}));
mock.module("@/services/contacts-storage", () => ({
	ContactStorage: { create: mock(() => Promise.resolve()) },
}));
mock.module("@/lib/send-contact-emails", () => ({
	sendContactEmails: mock(() => Promise.resolve()),
}));
mock.module("@/services/csrf", () => ({
	verifyCsrfToken: mock(() => true),
	CSRF_COOKIE: "interjudaica_csrf",
	CSRF_HEADER: "X-CSRF-Token",
}));

let POST: typeof POSTType;

const writableEnv = process.env as Record<string, string | undefined>;

const originalTurnstileSecret = process.env.TURNSTILE_SECRET_KEY;
const originalNodeEnv = process.env.NODE_ENV;

beforeAll(async () => {
	({ POST } = await import("@/app/api/contact/route"));
});

afterEach(() => {
	restoreEnv("TURNSTILE_SECRET_KEY", originalTurnstileSecret);
	restoreEnv("NODE_ENV", originalNodeEnv);

	mock.restore();
});

function restoreEnv(key: string, original: string | undefined) {
	if (original === undefined) {
		delete writableEnv[key];
	} else {
		writableEnv[key] = original;
	}
}

function setEnv(key: string, value: string | undefined) {
	if (value === undefined) {
		delete writableEnv[key];
	} else {
		writableEnv[key] = value;
	}
}

function makeRequest(body: Record<string, unknown>) {
	return new Request("http://localhost/api/contact", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRF-Token": "mock-csrf-token",
		},
		body: JSON.stringify(body),
	});
}

const validBody = {
	email: "test@example.com",
	firstName: "Test",
	lastName: "User",
	message: "Hello from test",
};

function callPost(body: Record<string, unknown>) {
	return POST(makeRequest(body) as Parameters<typeof POSTType>[0]);
}

describe("contact CAPTCHA enforcement", () => {
	test("with TURNSTILE_SECRET_KEY set: rejects missing turnstileToken with 400", async () => {
		setEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
		setEnv("NODE_ENV", "production");

		const bodyWithoutToken = {
			email: "test@example.com",
			firstName: "Test",
			lastName: "User",
			message: "Hello",
		};
		const res = await callPost(bodyWithoutToken);

		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.error).toBe("CAPTCHA verification required");
	});

	test("with TURNSTILE_SECRET_KEY set: verifies valid token and succeeds", async () => {
		setEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
		setEnv("NODE_ENV", "production");

		// Mock Turnstile verification to succeed
		(globalThis as Record<string, unknown>).fetch = mock(() =>
			Promise.resolve(
				new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			),
		) as unknown as typeof globalThis.fetch;

		const bodyWithToken = {
			...validBody,
			turnstileToken: "valid-mock-token",
		};
		const res = await callPost(bodyWithToken);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.ok).toBe(true);
	});

	test("with TURNSTILE_SECRET_KEY set: rejects invalid turnstileToken with 400", async () => {
		setEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
		setEnv("NODE_ENV", "production");

		// Mock Turnstile verification to fail
		(globalThis as Record<string, unknown>).fetch = mock(() =>
			Promise.resolve(
				new Response(JSON.stringify({ success: false }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			),
		) as unknown as typeof globalThis.fetch;

		const bodyWithBadToken = {
			...validBody,
			turnstileToken: "invalid-token",
		};
		const res = await callPost(bodyWithBadToken);

		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.error).toBe("CAPTCHA verification failed");
	});

	test("without TURNSTILE_SECRET_KEY: succeeds without token (backward compatible)", async () => {
		delete writableEnv.TURNSTILE_SECRET_KEY;
		setEnv("NODE_ENV", "development");

		const bodyWithoutToken = {
			email: "test@example.com",
			firstName: "Test",
			lastName: "User",
			message: "Hello",
		};
		const res = await callPost(bodyWithoutToken);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.ok).toBe(true);
	});
});
