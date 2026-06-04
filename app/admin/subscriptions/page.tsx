import type { Metadata } from "next";
import { AdminShell, DataTable } from "@/app/components/portal-ui";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { UserStorage } from "@/services/users-storage";
import { SubscriptionPlanStorage } from "@/services/subscription-plans-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Admin Subscriptions",
	description: "Manage InterJudaica community subscriptions.",
};

export default async function AdminSubscriptionsPage({
	searchParams,
}: {
	searchParams: Promise<{ plan?: string }>;
}) {
	const { plan: planFilter } = await searchParams;

	const communityUsers = await CommunityUserStorage.list();
	const users = await UserStorage.list();
	const userMap = new Map(users.map((u) => [u.uuid, u]));
	const plans = await SubscriptionPlanStorage.list(true);
	const planMap = new Map(plans.map((p) => [p.uuid, p]));

	const filtered = planFilter
		? communityUsers.filter((cu) => cu.planUuid === planFilter)
		: communityUsers;

	const rows = filtered.map((cu) => {
		const user = userMap.get(cu.userUuid);
		const plan = planMap.get(cu.planUuid);
		const name = user
			? `${user.firstName} ${user.lastName}`.trim() || user.email
			: cu.userUuid;
		const planLabel = plan
			? `${plan.name} ($${plan.price / 100}/${plan.billingInterval})`
			: "—";
		return [
			name,
			cu.status === "active" ? "Active" : "Cancelled",
			planLabel,
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
			description="Review active, cancelled, and manual subscription states."
		>
			{plans.length > 0 && (
				<div className="mb-6 flex flex-wrap items-center gap-2">
					<span className="text-sm font-semibold text-[var(--muted)]">Filter by plan:</span>
					{!planFilter ? (
						<span className="rounded-md bg-[var(--sapphire)] px-3 py-1 text-xs font-bold text-white">All</span>
					) : (
						<a href="/admin/subscriptions" className="rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--paper)]">All</a>
					)}
					{plans.map((p) => {
						const isActive = planFilter === p.uuid;
						return isActive ? (
							<span key={p.uuid} className="rounded-md bg-[var(--sapphire)] px-3 py-1 text-xs font-bold text-white">{p.name}</span>
						) : (
							<a key={p.uuid} href={`/admin/subscriptions?plan=${p.uuid}`} className="rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--paper)]">{p.name}</a>
						);
					})}
				</div>
			)}
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
