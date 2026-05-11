import type { Metadata } from "next";

import { AdminShell } from "@/app/components/portal-ui";
import { UserStorage } from "@/services/users-storage";
import { CommunityGrantForm } from "@/app/admin/community-users/community-grant-form";

export const metadata: Metadata = {
	title: "Community access",
	description: "Grant community access to a student.",
};

export const runtime = "nodejs";

export default async function CommunityUsersPage() {
	const users = await UserStorage.list();

	return (
		<AdminShell
			title="Community access"
			description="Grant community access without a payment."
		>
			<CommunityGrantForm users={users} />
		</AdminShell>
	);
}
