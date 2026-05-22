import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";

import type { getAuthSecret as getAuthSecretType } from "@/services/auth-secret";

mock.module("server-only", () => ({}));

let getAuthSecret: typeof getAuthSecretType;

const originalAuthSecret = process.env.AUTH_SECRET;
const originalNextAuthSecret = process.env.NEXTAUTH_SECRET;
const originalNodeEnv = process.env.NODE_ENV;
const writableEnv = process.env as Record<string, string | undefined>;

beforeAll(async () => {
	({ getAuthSecret } = await import("@/services/auth-secret"));
});

afterEach(() => {
	if (originalAuthSecret === undefined) {
		delete process.env.AUTH_SECRET;
	} else {
		process.env.AUTH_SECRET = originalAuthSecret;
	}

	if (originalNextAuthSecret === undefined) {
		delete process.env.NEXTAUTH_SECRET;
	} else {
		process.env.NEXTAUTH_SECRET = originalNextAuthSecret;
	}

	setNodeEnv(originalNodeEnv);
});

describe("getAuthSecret", () => {
	test("prefers AUTH_SECRET", () => {
		process.env.AUTH_SECRET = "primary-secret";
		process.env.NEXTAUTH_SECRET = "secondary-secret";
		setNodeEnv("production");

		expect(getAuthSecret()).toBe("primary-secret");
	});

	test("falls back to NEXTAUTH_SECRET", () => {
		delete process.env.AUTH_SECRET;
		process.env.NEXTAUTH_SECRET = "secondary-secret";
		setNodeEnv("production");

		expect(getAuthSecret()).toBe("secondary-secret");
	});

	test("allows the local development fallback outside production", () => {
		delete process.env.AUTH_SECRET;
		delete process.env.NEXTAUTH_SECRET;
		setNodeEnv("development");

		expect(getAuthSecret()).toBe("interjudaica-local-development-secret");
	});

	test("fails closed in production when no secret is configured", () => {
		delete process.env.AUTH_SECRET;
		delete process.env.NEXTAUTH_SECRET;
		setNodeEnv("production");

		expect(() => getAuthSecret()).toThrow(
			"AUTH_SECRET or NEXTAUTH_SECRET must be set in production",
		);
	});
});

function setNodeEnv(value: string | undefined) {
	if (value === undefined) {
		delete writableEnv.NODE_ENV;
		return;
	}

	writableEnv.NODE_ENV = value;
}
