import { expect, test } from "@playwright/test";

test.describe("public forms", () => {
	test("shows the contact success state without leaving the page", async ({ page }) => {
		await page.route("**/api/contact", route =>
			route.fulfill({
				body: JSON.stringify({ ok: true }),
				contentType: "application/json",
				status: 201,
			}),
		);

		await page.goto("/contact");
		await page.getByLabel("Email").fill("student@example.com");
		await page.getByLabel("First name").fill("Sarah");
		await page.getByLabel("Last name").fill("Cohen");
		await page.getByLabel("Message").fill("I would like details about the next cohort.");
		await page.getByRole("button", { name: /^Send$/i }).click();

		await expect(page.getByText(/Message sent/i)).toBeVisible();
		await expect(page.getByText(/Thank you for reaching out/i)).toBeVisible();
	});

	test("keeps student login errors visible", async ({ page }) => {
		await page.route("**/api/user-auth/login", route =>
			route.fulfill({
				body: JSON.stringify({ error: "Invalid credentials" }),
				contentType: "application/json",
				status: 401,
			}),
		);

		await page.goto("/login");
		await page.getByLabel("Email").fill("student@example.com");
		await page.getByLabel("Password").fill("wrong-password");
		await page.getByRole("button", { name: /^Sign in$/i }).click();

		await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
	});

	test("keeps operator login errors visible", async ({ page }) => {
		await page.route("**/api/auth/login", route =>
			route.fulfill({
				body: JSON.stringify({ error: "Invalid credentials" }),
				contentType: "application/json",
				status: 401,
			}),
		);

		await page.goto("/operator-login");
		await page.getByLabel("Email").fill("operator@example.com");
		await page.getByLabel("Password").fill("wrong-password");
		await page.getByRole("button", { name: /^Sign in$/i }).click();

		await expect(page.getByText(/Unable to sign in/i)).toBeVisible();
	});
});

test.describe("security headers and unauthenticated APIs", () => {
	test("serves baseline production hardening headers", async ({ request }) => {
		const response = await request.get("/");
		const headers = response.headers();

		expect(response.status()).toBeLessThan(400);
		expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
		expect(headers["content-security-policy"]).toContain("object-src 'none'");
		expect(headers["strict-transport-security"]).toContain("includeSubDomains");
		expect(headers["x-content-type-options"]).toBe("nosniff");
		expect(headers["x-frame-options"]).toBe("DENY");
		expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
		expect(headers["permissions-policy"]).toContain("camera=()");
		expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
	});

	test("rejects unauthenticated admin API requests", async ({ request }) => {
		const response = await request.get("/api/admin/courses");

		expect(response.status()).toBe(401);
		expect(await response.json()).toEqual({ error: "Unauthorized" });
	});

	test("returns a null student session when unauthenticated", async ({ request }) => {
		const response = await request.get("/api/user-auth/me");

		expect(response.status()).toBe(401);
		expect(await response.json()).toEqual({ user: null });
	});
});
