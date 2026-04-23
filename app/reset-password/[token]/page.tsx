import type { Metadata } from "next";
import { AuthPanel, ButtonLink, Field } from "@/app/components/portal-ui";

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
      <form className="grid gap-5">
        <Field label="New password" name="password" type="password" />
        <Field
          label="Confirm new password"
          name="confirmPassword"
          type="password"
        />
        <ButtonLink href="/login">Save password</ButtonLink>
      </form>
    </AuthPanel>
  );
}
