import "server-only";

import { unstable_cache } from "next/cache";
import type { TypeRabbiBio } from "@/models/rabbi-bio";
import { RabbiBioStorage } from "@/services/rabbi-bio-storage";

const getRabbiBioCached = unstable_cache(
	async () => RabbiBioStorage.getBySlug("ernesto-yattah"),
	["rabbi-bio", "ernesto-yattah"],
	{ revalidate: 60 },
);

export async function getRabbiBio(): Promise<TypeRabbiBio | null> {
	return getRabbiBioCached();
}
