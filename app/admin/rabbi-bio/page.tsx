import type { Metadata } from "next";

import { AdminShell } from "@/app/components/portal-ui";
import { RabbiBioStorage } from "@/services/rabbi-bio-storage";
import { RabbiBioForm } from "@/app/admin/rabbi-bio/rabbi-bio-form";

export const metadata: Metadata = {
	title: "Rabbi bio",
	description: "Edit the public bio for Rabbi Ernesto Yattah.",
};

export const runtime = "nodejs";

export default async function RabbiBioPage() {
	const bio = await RabbiBioStorage.getBySlug("ernesto-yattah");

	return (
		<AdminShell title="Rabbi bio" description="Update the public bio content.">
			<RabbiBioForm bio={bio} />
		</AdminShell>
	);
}
