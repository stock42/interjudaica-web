import "server-only";

import { headers } from "next/headers";
import type { TypePaper } from "@/models/papers";

async function getBaseUrl() {
	const headerList = await headers();
	const host = headerList.get("host");

	if (!host) {
		return "http://localhost:3025";
	}

	const protocol = host.includes("localhost") ? "http" : "https";
	return `${protocol}://${host}`;
}

export async function listCommunityPapers(): Promise<TypePaper[]> {
	const baseUrl = await getBaseUrl();
	const response = await fetch(`${baseUrl}/api/papers?visibility=community`, {
		cache: "no-store",
	});

	if (!response.ok) {
		return [];
	}

	const data = (await response.json()) as { items?: TypePaper[] };
	return data.items ?? [];
}

export async function getPaperBySlug(slug: string): Promise<TypePaper | null> {
	const baseUrl = await getBaseUrl();
	const response = await fetch(`${baseUrl}/api/papers/${slug}`, {
		cache: "no-store",
	});

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as { item?: TypePaper };
	return data.item ?? null;
}
