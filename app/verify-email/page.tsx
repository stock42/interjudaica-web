import type { Metadata } from "next";
import { ButtonLink, PageShell, Section } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your InterJudaica email address.",
};

export default function VerifyEmailPage() {
  return (
    <PageShell>
      <Section tone="transparent">
        <div className="mx-auto max-w-2xl rounded-lg border border-[var(--line)] bg-white p-6 text-center shadow-[0_18px_60px_rgba(17,19,21,0.08)] sm:p-10">
          <p className="text-sm font-bold uppercase text-[var(--sapphire)]">
            Email verification
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight">
            Check your inbox
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            We sent a verification link to the email address on your account.
            Once verified, your student dashboard and purchases will be ready.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/dashboard">Continue to dashboard</ButtonLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
