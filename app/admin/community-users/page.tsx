import type { Metadata } from "next";

import { AdminShell } from "@/app/components/portal-ui";
import { UserStorage } from "@/services/users-storage";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { CommunityGrantForm } from "@/app/admin/community-users/community-grant-form";
import { CommunityUsersList } from "@/app/admin/community-users/community-users-list";

export const metadata: Metadata = {
	title: "Community access",
	description: "Grant community access to a student.",
};

export const runtime = "nodejs";

export default async function CommunityUsersPage() {
	const [users, communityUsers] = await Promise.all([
		UserStorage.list(),
		CommunityUserStorage.list(),
	]);

	const rows = communityUsers.map((entry) => {
		const user = users.find((record) => record.uuid === entry.userUuid);
		return {
			uuid: entry.uuid ?? "",
			userUuid: entry.userUuid,
			name: user
				? `${user.firstName} ${user.lastName}`.trim()
				: entry.userUuid,
			email: user?.email ?? "",
			status: entry.status,
			subscribedAt: entry.subscribedAt,
		};
	});

	return (
		<AdminShell
			title="Community access"
			description="Grant community access without a payment."
		>
			<div className="grid gap-6">
				<CommunityGrantForm users={users} />
				<CommunityUsersList rows={rows} />
			</div>
		</AdminShell>
	);
}
