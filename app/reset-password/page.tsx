import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/app/components/portal-ui";
import ResetPasswordForm from "@/app/reset-password/reset-password-form";

export const metadata: Metadata = {
	title: "Reset password",
	description: "Set a new InterJudaica account password.",
};

export default function ResetPasswordPage() {
	return (
		<AuthPanel
			title="Choose a new password"
			text="Enter the 6-digit code we emailed you and pick a new password."
		>
			<Suspense>
				<ResetPasswordForm />
			</Suspense>
		</AuthPanel>
	);
}
