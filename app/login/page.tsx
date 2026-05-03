import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/app/components/portal-ui";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentOperator } from "@/services/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your InterJudaica student account.",
};

export default async function LoginPage({
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
      title="Admin access"
      text="Enter with an operator account to manage courses, papers, forum threads, students, and platform operations."
    >
      <LoginForm nextPath={next} />
      <Link
        href="/"
        className="mt-5 inline-flex text-sm font-semibold text-[var(--sapphire)] underline underline-offset-4"
      >
        Back to site
      </Link>
    </AuthPanel>
  );
}
