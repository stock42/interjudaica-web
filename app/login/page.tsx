import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel, ButtonLink, Field } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your InterJudaica student account.",
};

export default function LoginPage() {
  return (
    <AuthPanel
      title="Sign in to continue learning"
      text="Access purchased courses, class recordings, certificates, subscription status, and private forum threads."
    >
      <form className="grid gap-5">
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
        />
        <Field label="Password" name="password" type="password" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ButtonLink href="/dashboard">Sign in</ButtonLink>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-[var(--sapphire)] underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          New to InterJudaica?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--sapphire)] underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthPanel>
  );
}
