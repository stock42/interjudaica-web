import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageForm } from "@/app/admin/pages/page-form";
import { AdminShell } from "@/app/components/portal-ui";
import { PageStorage } from "@/services/pages-storage";

export const metadata: Metadata = {
	title: "Edit Page",
	description: "Edit a dynamic content page.",
};

export const runtime = "nodejs";

export default async function EditPagePage({
	params,
}: {
	params: Promise<{ uuid: string }>;
}) {
	const { uuid } = await params;
	const page = await PageStorage.get(uuid);

	if (!page) {
		notFound();
	}

	return (
		<AdminShell
			title="Edit page"
			description="Update title, description, content, and publishing status."
		>
			<PageForm page={page} />
		</AdminShell>
	);
}
