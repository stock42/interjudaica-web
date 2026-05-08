import "server-only";

import { headers } from "next/headers";
import type { TypeRabbiBio } from "@/models/rabbi-bio";

async function getBaseUrl() {
	const headerList = await headers();
	const host = headerList.get("host");

	if (!host) {
		return "http://localhost:3025";
	}

	const protocol = host.includes("localhost") ? "http" : "https";
	return `${protocol}://${host}`;
}

export async function getRabbiBio(): Promise<TypeRabbiBio | null> {
	const baseUrl = await getBaseUrl();
	const response = await fetch(`${baseUrl}/api/rabbi-bio`, {
		cache: "no-store",
	});

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as { item?: TypeRabbiBio };
	return data.item ?? null;
}
