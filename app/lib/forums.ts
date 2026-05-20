import "server-only";

import { unstable_cache } from "next/cache";
import type { TypeForumThread } from "@/models/forums";
import { ForumStorage } from "@/services/forums-storage";

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
	const listForumThreadsCached = unstable_cache(
		async () => ForumStorage.listByFilter({ area, courseSlug, page, limit }),
		["forum-threads", area ?? "all", courseSlug ?? "all", String(page), String(limit)],
		{ revalidate: 30 },
	);

	return listForumThreadsCached();
}
