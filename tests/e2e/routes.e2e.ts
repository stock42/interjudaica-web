import { expect, test } from "@playwright/test";

const publicPages = [
	{ path: "/", heading: /Learn Judaism/i },
	{ path: "/courses", heading: /Live and self-paced Jewish learning/i },
	{ path: "/books", heading: /^Books$/i },
	{ path: "/community", heading: /Study between courses/i },
	{ path: "/forum", heading: /^Announcements$/i },
	{ path: "/contact", heading: /Send a message/i },
	{ path: "/ernesto-yattah", heading: /Ernesto Yattah/i },
	{ path: "/login", heading: /Sign in to InterJudaica/i },
	{ path: "/register", heading: /Create your student account/i },
	{ path: "/forgot-password", heading: /Reset your password/i },
	{ path: "/reset-password", heading: /Choose a new password/i },
	{ path: "/reset-password/example-token", heading: /Choose a new password/i },
	{ path: "/verify-email", heading: /Verify your email/i },
	{ path: "/operator-login", heading: /Operator access/i },
];

const protectedPages = [
	{ path: "/dashboard", redirect: /\/login\?next=%2Fdashboard|\/login\?next=\/dashboard/ },
	{ path: "/support", redirect: /\/login\?next=%2Fsupport|\/login\?next=\/support/ },
	{
		path: "/checkout-community",
		redirect: /\/login\?next=%2Fcheckout-community|\/login\?next=\/checkout-community/,
	},
	{
		path: "/community/papers",
		redirect: /\/login\?next=%2Fcommunity%2Fpapers|\/login\?next=\/community\/papers/,
	},
	{
		path: "/community/forum",
		redirect: /\/login\?next=%2Fcommunity%2Fforum|\/login\?next=\/community\/forum/,
	},
	{
		path: "/admin",
		redirect: /\/operator-login\?next=%2Fadmin|\/operator-login\?next=\/admin/,
	},
];

test.describe("route smoke coverage", () => {
	for (const route of publicPages) {
		test(`${route.path} renders`, async ({ page }) => {
			const response = await page.goto(route.path);

			expect(response?.status()).toBeLessThan(400);
			await expect(page.getByRole("banner")).toContainText("InterJudaica");
			await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
			await expect(page.getByRole("contentinfo")).toContainText("InterJudaica");
		});
	}

	for (const route of protectedPages) {
		test(`${route.path} redirects unauthenticated visitors`, async ({ page }) => {
			const response = await page.goto(route.path);

			expect(response?.status()).toBeLessThan(400);
			await expect(page).toHaveURL(route.redirect);
			await expect(page.getByRole("heading", { name: /Sign in|Operator access/i })).toBeVisible();
		});
	}
});
