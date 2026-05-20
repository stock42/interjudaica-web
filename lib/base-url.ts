type HeaderLike =
	| Headers
	| { get(name: string): string | null | undefined }
	| Record<string, string | undefined>;

function readHeader(headers: HeaderLike | undefined, name: string) {
	if (!headers) {
		return undefined;
	}

	if (typeof (headers as { get?: unknown }).get === "function") {
		return (headers as { get(name: string): string | null | undefined }).get(name) ?? undefined;
	}

	const normalizedName = name.toLowerCase();
	for (const [key, value] of Object.entries(headers)) {
		if (key.toLowerCase() === normalizedName) {
			return value;
		}
	}

	return undefined;
}

export function resolveBaseUrlFromHeaders(
	headers?: HeaderLike,
	fallback = "http://localhost:3025",
) {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
	if (siteUrl) {
		return siteUrl;
	}

	const host = readHeader(headers, "x-forwarded-host") ?? readHeader(headers, "host");
	if (!host) {
		return fallback;
	}

	const proto =
		readHeader(headers, "x-forwarded-proto") ??
		(host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

	return `${proto}://${host}`;
}

export function getBaseUrl(request?: { headers?: HeaderLike }) {
	return resolveBaseUrlFromHeaders(request?.headers);
}
