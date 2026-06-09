import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3026);
const baseURL =
	process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const shouldStartServer =
	!process.env.PLAYWRIGHT_BASE_URL &&
	process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== "1";

export default defineConfig({
	testDir: "./tests",
	testMatch: "**/*.e2e.ts",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: [
		["list"],
		["html", { open: "never" }],
	],
	timeout: 30_000,
	expect: {
		timeout: 10_000,
	},
	use: {
		...devices["Desktop Chrome"],
		baseURL,
		locale: "en-US",
		screenshot: "only-on-failure",
		trace: "on-first-retry",
		video: "retain-on-failure",
	},
	webServer: shouldStartServer
		? {
				command: `bun run dev -- --hostname 127.0.0.1 --port ${port}`,
				env: {
					...process.env,
					NEXT_PUBLIC_SITE_URL: baseURL,
					PORT: String(port),
				},
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
				url: baseURL,
			}
		: undefined,
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
