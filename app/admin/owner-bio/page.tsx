import type { Metadata } from "next";

import { AdminShell } from "@/app/components/portal-ui";
import { OwnerBioStorage } from "@/services/owner-bio-storage";
import { OwnerBioForm } from "@/app/admin/owner-bio/owner-bio-form";

export const metadata: Metadata = {
	title: "Owner biography",
	description: "Edit the public bio for Ernesto Yattah.",
};

export const runtime = "nodejs";

export default async function OwnerBioPage() {
	const bio = await OwnerBioStorage.getBySlug("ernesto-yattah");

	return (
		<AdminShell title="Owner biography" description="Update the public bio content.">
			<OwnerBioForm bio={bio} />
		</AdminShell>
	);
}
