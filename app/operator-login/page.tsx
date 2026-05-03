import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/app/components/portal-ui";
import { OperatorLoginForm } from "@/app/operator-login/operator-login-form";
import { getCurrentOperator } from "@/services/auth";

export const metadata: Metadata = {
  title: "Operator Sign In",
  description: "Sign in to the InterJudaica backoffice.",
};

export default async function OperatorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const operator = await getCurrentOperator();
  const { next } = await searchParams;

  if (operator) {
    redirect(next?.startsWith("/") ? next : "/admin");
  }

  return (
    <AuthPanel
      eyebrow="Backoffice"
      title="Operator access"
      text="Enter with an operator account to manage courses, papers, forum threads, students, and platform operations."
    >
      <OperatorLoginForm nextPath={next} />
      <Link
        href="/login"
        className="mt-5 inline-flex text-sm font-semibold text-[var(--sapphire)] underline underline-offset-4"
      >
        Student sign in
      </Link>
    </AuthPanel>
  );
}
