import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/app/components/portal-ui";
import { RegisterForm } from "@/app/register/register-form";
import { getCurrentUser } from "@/services/user-auth";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an InterJudaica student account.",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthPanel
      title="Create your student account"
      text="Register to buy courses, join the monthly community, participate in forums, and receive certificates."
    >
      <RegisterForm />
    </AuthPanel>
  );
}
