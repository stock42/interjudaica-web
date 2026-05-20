import "server-only";

import { unstable_cache } from "next/cache";
import type { TypeSocialProof } from "@/models/social-proof";
import { SocialProofStorage } from "@/services/social-proof-storage";

const listSocialProofCached = unstable_cache(
	async () => SocialProofStorage.listPublished(),
	["social-proof"],
	{ revalidate: 60 },
);

export async function listSocialProof(): Promise<TypeSocialProof[]> {
	return listSocialProofCached();
}
