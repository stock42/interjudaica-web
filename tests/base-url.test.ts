import { describe, expect, test } from "bun:test";

import { resolveBaseUrlFromHeaders } from "@/lib/base-url";

describe("resolveBaseUrlFromHeaders", () => {
	test("prefers NEXT_PUBLIC_SITE_URL when present", () => {
		const previous = process.env.NEXT_PUBLIC_SITE_URL;
		process.env.NEXT_PUBLIC_SITE_URL = "https://interjudaica.example";

		expect(
			resolveBaseUrlFromHeaders({ host: "ignored.example", "x-forwarded-proto": "http" }),
		).toBe("https://interjudaica.example");

		if (previous === undefined) {
			delete process.env.NEXT_PUBLIC_SITE_URL;
		} else {
			process.env.NEXT_PUBLIC_SITE_URL = previous;
		}
	});

	test("uses forwarded host and proto when available", () => {
		expect(
			resolveBaseUrlFromHeaders({
				host: "internal.example",
				"x-forwarded-host": "interjudaica.org",
				"x-forwarded-proto": "https",
			}),
		).toBe("https://interjudaica.org");
	});

	test("falls back to localhost when no headers exist", () => {
		const previous = process.env.NEXT_PUBLIC_SITE_URL;
		delete process.env.NEXT_PUBLIC_SITE_URL;

		expect(resolveBaseUrlFromHeaders(undefined)).toBe("http://localhost:3025");

		if (previous !== undefined) {
			process.env.NEXT_PUBLIC_SITE_URL = previous;
		}
	});
});
