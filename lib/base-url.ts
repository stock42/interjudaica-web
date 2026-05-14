export function getBaseUrl() {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
	if (siteUrl) return siteUrl;
	return "http://localhost:3025";
}
