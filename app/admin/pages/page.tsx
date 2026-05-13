import type { Metadata } from "next";
import { PageList } from "@/app/admin/pages/page-list";
import { AdminShell } from "@/app/components/portal-ui";
import { PageStorage } from "@/services/pages-storage";

export const metadata: Metadata = {
	title: "Admin Pages",
	description: "Manage dynamic content pages.",
};

export const runtime = "nodejs";

export default async function AdminPagesPage() {
	const pages = await PageStorage.list();

	return (
		<AdminShell
			title="Pages"
			description="Create and manage dynamic content pages visible under /page/:slug."
		>
			<PageList pages={pages} />
		</AdminShell>
	);
}
