import "server-only";

import { unstable_cache } from "next/cache";
import type { TypePaper } from "@/models/papers";
import { PaperStorage } from "@/services/papers-storage";

export async function listCommunityPapers(): Promise<TypePaper[]> {
	const listCommunityPapersCached = unstable_cache(
		async () => PaperStorage.listPublishedByVisibility("community"),
		["community-papers"],
		{ revalidate: 60 },
	);

	return listCommunityPapersCached();
}

export async function getPaperBySlug(slug: string): Promise<TypePaper | null> {
	const getPaperBySlugCached = unstable_cache(
		async () => PaperStorage.findPublishedBySlug(slug),
		["paper", slug],
		{ revalidate: 60 },
	);

	return getPaperBySlugCached();
}
