import type { Metadata } from "next";

import { AuthPanel } from "@/app/components/portal-ui";
import ResetPasswordForm from "@/app/reset-password/[token]/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new InterJudaica account password.",
};

export default function ResetPasswordPage() {
  return (
    <AuthPanel
      title="Choose a new password"
      text="Set a secure password and return to your student dashboard."
    >
      <ResetPasswordForm />
    </AuthPanel>
  );
}
