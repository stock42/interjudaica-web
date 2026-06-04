import 'server-only'

import { CommunityUserStorage } from '@/services/community-users-storage'
import { MongoDBStorage } from '@/services/MongoDBStorage'

/**
 * One-time cleanup: removes all existing community_users records.
 * Run via: curl -X POST /api/admin/community-users/cleanup
 * Safe to remove once all subscriptions are migrated.
 */
export async function cleanupCommunityUsers() {
	const collection = await MongoDBStorage.getCollection(
		CommunityUserStorage.COLLECTION,
	)
	const result = await collection.deleteMany({})
	return { deletedCount: result.deletedCount }
}
