import 'server-only'

import { unstable_cache } from 'next/cache'
import type { TypeOwnerBio } from '@/models/owner-bio'
import { OwnerBioStorage } from '@/services/owner-bio-storage'

const getOwnerBioCached = unstable_cache(
	async () => OwnerBioStorage.getBySlug('ernesto-yattah'),
	['owner-bio', 'ernesto-yattah'],
	{ revalidate: 60 },
)

export async function getOwnerBio(): Promise<TypeOwnerBio | null> {
	return getOwnerBioCached()
}
