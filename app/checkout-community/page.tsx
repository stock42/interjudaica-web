import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/app/components/portal-ui";
import { getCurrentUser } from "@/services/user-auth";
import { CheckoutCommunityForm } from "@/app/checkout-community/checkout-community-form";

export const metadata: Metadata = {
	title: "Community checkout",
	description: "Subscribe to the InterJudaica community.",
};

export const runtime = "nodejs";

export default async function CheckoutCommunityPage({
	searchParams,
}: {
	searchParams: Promise<{ payment?: string }>;
}) {
	const user = await getCurrentUser();
	if (!user) {
		redirect("/login?next=/checkout-community");
	}

	const { payment } = await searchParams;

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
			<CheckoutCommunityForm />
		</AuthPanel>
	);
}
