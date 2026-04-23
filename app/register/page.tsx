import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel, ButtonLink, Field } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an InterJudaica student account.",
};

export default function RegisterPage() {
  return (
    <AuthPanel
      title="Create your student account"
      text="Register to buy courses, join the monthly community, participate in forums, and receive certificates."
    >
      <form className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" name="firstName" />
          <Field label="Last name" name="lastName" />
        </div>
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" name="password" type="password" />
          <Field
            label="Confirm password"
            name="confirmPassword"
            type="password"
          />
        </div>
        <ButtonLink href="/verify-email">Create account</ButtonLink>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--sapphire)] underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthPanel>
  );
}
