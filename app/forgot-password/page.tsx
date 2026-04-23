import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel, ButtonLink, Field } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request an InterJudaica password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      title="Reset your password"
      text="Enter the email connected to your InterJudaica account and continue from the reset link sent to your inbox."
    >
      <form className="grid gap-5">
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
        />
        <ButtonLink href="/reset-password/demo-token">Send reset link</ButtonLink>
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--sapphire)] underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </form>
    </AuthPanel>
  );
}
