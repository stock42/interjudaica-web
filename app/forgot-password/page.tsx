import type { Metadata } from "next";
import Link from "next/link";

import { AuthPanel } from "@/app/components/portal-ui";
import ForgotPasswordForm from "@/app/forgot-password/reset-request-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request an InterJudaica password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      title="Reset your password"
      text="Enter the email connected to your InterJudaica account and we will send a 6-digit code."
    >
      <ForgotPasswordForm />
      <Link
        href="/login"
        className="mt-5 inline-flex text-sm font-semibold text-[var(--sapphire)] underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </AuthPanel>
  );
}
