import "server-only";

import { headers } from "next/headers";
import type { TypeForumThread } from "@/models/forums";

async function getBaseUrl() {
	const headerList = await headers();
	const host = headerList.get("host");

	if (!host) {
		return "http://localhost:3025";
	}

	const protocol = host.includes("localhost") ? "http" : "https";
	return `${protocol}://${host}`;
}

export async function listForumThreads({
	area,
	courseSlug,
}: {
	area?: string;
	courseSlug?: string;
}): Promise<TypeForumThread[]> {
	const baseUrl = await getBaseUrl();
	const params = new URLSearchParams();
	if (area) {
		params.set("area", area);
	}
	if (courseSlug) {
		params.set("courseSlug", courseSlug);
	}

	const response = await fetch(`${baseUrl}/api/forums?${params.toString()}`, {
		cache: "no-store",
	});

	if (!response.ok) {
		return [];
	}

	const data = (await response.json()) as { items?: TypeForumThread[] };
	return data.items ?? [];
}
