import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/app/components/portal-ui";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser } from "@/services/user-auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your InterJudaica student account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;

  if (user) {
    redirect(next?.startsWith("/") ? next : "/dashboard");
  }

  return (
    <AuthPanel
      eyebrow="Student access"
      title="Sign in to InterJudaica"
      text="Use your student account to access courses, community membership, papers, and forum discussions."
    >
      <LoginForm nextPath={next} />
      <Link
        href="/forgot-password"
        className="mt-5 inline-flex text-sm font-semibold text-[var(--sapphire)] underline underline-offset-4"
      >
        Forgot password?
      </Link>
      <Link
        href="/register"
        className="mt-5 inline-flex text-sm font-semibold text-[var(--sapphire)] underline underline-offset-4"
      >
        Create student account
      </Link>
    </AuthPanel>
  );
}
