import type { Metadata } from "next";

import { AdminCollectionManager } from "@/app/admin/components/admin-collection-manager";
import { AdminShell } from "@/app/components/portal-ui";
import { CouponStorage } from "@/services/coupons-storage";

export const metadata: Metadata = {
	title: "Coupons",
	description: "Create and manage discount codes.",
};

export const runtime = "nodejs";

export default async function CouponsPage() {
	const coupons = await CouponStorage.list();

	return (
		<AdminShell title="Coupons" description="Create discount coupons for courses and community.">
			<AdminCollectionManager kind="coupons" initialItems={coupons} />
		</AdminShell>
	);
}
