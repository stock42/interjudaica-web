import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPanel } from "@/app/components/portal-ui";
import { VerifyEmailForm } from "@/app/verify-email/verify-email-form";

export const metadata: Metadata = {
	title: "Verify email",
	description: "Verify your InterJudaica email address.",
};

export default function VerifyEmailPage() {
	return (
		<AuthPanel
			title="Verify your email"
			text="Enter the 6-digit code we sent to your inbox to activate your account."
		>
			<Suspense fallback={null}>
				<VerifyEmailForm />
			</Suspense>
		</AuthPanel>
	);
}
