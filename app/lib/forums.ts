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
	page = 1,
	limit = 10,
}: {
	area?: string;
	courseSlug?: string;
	page?: number;
	limit?: number;
}): Promise<{ items: TypeForumThread[]; page: number; totalPages: number }> {
	const baseUrl = await getBaseUrl();
	const params = new URLSearchParams();
	if (area) {
		params.set("area", area);
	}
	if (courseSlug) {
		params.set("courseSlug", courseSlug);
	}
	params.set("page", String(page));
	params.set("limit", String(limit));

	const response = await fetch(`${baseUrl}/api/forums?${params.toString()}`, {
		cache: "no-store",
	});

	if (!response.ok) {
		return { items: [], page, totalPages: 1 };
	}

	const data = (await response.json()) as {
		items?: TypeForumThread[];
		page?: number;
		totalPages?: number;
	};
	return {
		items: data.items ?? [],
		page: data.page ?? page,
		totalPages: data.totalPages ?? 1,
	};
}
