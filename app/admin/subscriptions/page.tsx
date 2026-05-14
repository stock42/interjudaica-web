import type { Metadata } from "next";
import { AdminShell, DataTable } from "@/app/components/portal-ui";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { UserStorage } from "@/services/users-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Admin Subscriptions",
	description: "Manage InterJudaica community subscriptions.",
};

export default async function AdminSubscriptionsPage() {
	const communityUsers = await CommunityUserStorage.list();
	const users = await UserStorage.list();
	const userMap = new Map(users.map((u) => [u.uuid, u]));

	const rows = communityUsers.map((cu) => {
		const user = userMap.get(cu.userUuid);
		const name = user
			? `${user.firstName} ${user.lastName}`.trim() || user.email
			: cu.userUuid;
		return [
			name,
			cu.status === "active" ? "Active" : "Cancelled",
			"$19 USD/month",
			cu.subscribedAt
				? new Date(cu.subscribedAt).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					})
				: "-",
			cu.stripeSubscriptionId ? "Stripe" : "Manual",
			cu.status === "active" ? "Active subscription" : "Access ended",
		];
	});

	return (
		<AdminShell
			title="Community subscriptions"
			description="Review active, cancelled, and manual subscription states for the $19 USD/month community plan."
		>
			<DataTable
				columns={["Member", "Status", "Plan", "Start date", "Source", "Notes"]}
				rows={
					rows.length
						? rows
						: [[]]
				}
			/>
		</AdminShell>
	);
}
