import type { Metadata } from "next";
import { ConfigForm } from "@/app/admin/config/config-form";
import { AdminShell } from "@/app/components/portal-ui";
import { ConfigStorage } from "@/services/config-storage";

export const metadata: Metadata = {
	title: "Admin Config",
	description: "Configure system settings.",
};

export const runtime = "nodejs";

export default async function AdminConfigPage() {
	const config = await ConfigStorage.getAll();

	return (
		<AdminShell
			title="Configuration"
			description="Manage system-wide settings. Changes take effect immediately."
		>
			<ConfigForm config={config} />
		</AdminShell>
	);
}
