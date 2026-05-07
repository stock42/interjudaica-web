import type { Metadata } from "next";

import { AdminShell } from "@/app/components/portal-ui";
import { PasswordResetAttemptStorage } from "@/services/password-reset-attempts-storage";
import { PasswordResetList } from "@/app/admin/password-resets/password-reset-list";

export const metadata: Metadata = {
	title: "Password resets",
	description: "Audit password reset attempts.",
};

export const runtime = "nodejs";

export default async function PasswordResetsPage() {
	const attempts = await PasswordResetAttemptStorage.list();

	return (
		<AdminShell
			title="Password resets"
			description="Review password reset attempts and lockouts."
		>
			<PasswordResetList attempts={attempts} />
		</AdminShell>
	);
}
