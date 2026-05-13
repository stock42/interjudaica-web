import type { Metadata } from "next";
import { PageForm } from "@/app/admin/pages/page-form";
import { AdminShell } from "@/app/components/portal-ui";

export const metadata: Metadata = {
	title: "New Page",
	description: "Create a new dynamic content page.",
};

export const runtime = "nodejs";

export default async function NewPagePage() {
	return (
		<AdminShell
			title="New page"
			description="Create a dynamic content page visible under /page/:slug."
		>
			<PageForm />
		</AdminShell>
	);
}
