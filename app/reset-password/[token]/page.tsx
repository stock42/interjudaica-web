import { redirect } from "next/navigation";

export default function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  void params;
  redirect("/reset-password");
}
