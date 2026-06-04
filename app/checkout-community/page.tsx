import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { AuthPanel } from "@/app/components/portal-ui";
import { getCurrentUser } from "@/services/user-auth";
import { SubscriptionPlanStorage } from "@/services/subscription-plans-storage";
import { CheckoutCommunityForm } from "@/app/checkout-community/checkout-community-form";

export const metadata: Metadata = {
	title: "Community checkout",
	description: "Subscribe to the InterJudaica community.",
};

export const runtime = "nodejs";

export default async function CheckoutCommunityPage({
	searchParams,
}: {
	searchParams: Promise<{ payment?: string; planUuid?: string }>;
}) {
	const user = await getCurrentUser();
	if (!user) {
		redirect("/login?next=/checkout-community");
	}

	const { payment, planUuid } = await searchParams;

	if (!planUuid) {
		redirect("/community");
	}

	const plan = await SubscriptionPlanStorage.get(planUuid);
	if (!plan) {
		notFound();
	}

	return (
		<AuthPanel
			title="Community membership"
			text="Subscribe to access the InterJudaica community." 
		>
			{payment === "cancelled" ? (
				<p className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--muted)]">
					Payment was cancelled. You can try again when you are ready.
				</p>
			) : null}
			<CheckoutCommunityForm planUuid={planUuid} planName={plan.name} planPriceCents={plan.price} planInterval={plan.billingInterval} planDescription={plan.description} />
		</AuthPanel>
	);
}
