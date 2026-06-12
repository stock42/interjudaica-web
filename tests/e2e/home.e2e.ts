import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
	);

	expect(overflow).toBeLessThanOrEqual(2);
}

test.describe("home page", () => {
	test("presents the public landing page without empty publishing states", async ({
		page,
	}) => {
		const pageErrors: string[] = [];
		page.on("pageerror", error => pageErrors.push(error.message));

		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: /Learn Judaism/i }),
		).toBeVisible();
		await expect(page.getByRole("link", { name: /View courses/i })).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Featured Courses/i }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Ernesto Yattah/i }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Why Choose InterJudaica/i }),
		).toBeVisible();
		await expect(
			page.getByText(/No testimonials have been published yet/i),
		).toHaveCount(0);
		await expect(
			page.getByRole("heading", {
				name: /Join InterJudaica and begin your next course today/i,
			}),
		).toBeVisible();

		const courseLinks = page.getByRole("link", { name: /More information/i });
		if ((await courseLinks.count()) === 0) {
			await expect(
				page.getByText(/No public courses are available yet/i),
			).toBeVisible();
		} else {
			await expect(courseLinks.first()).toBeVisible();
		}

		await expectNoHorizontalOverflow(page);
		expect(pageErrors).toEqual([]);
	});

	test("keeps the home layout usable on mobile widths", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");

		await expect(page.getByRole("banner")).toContainText("InterJudaica");
		await expect(page.getByRole("link", { name: /View courses/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /Enroll now/i })).toBeVisible();
		await expectNoHorizontalOverflow(page);
	});
});
