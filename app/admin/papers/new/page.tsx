import type { Metadata } from "next";
import { PaperForm } from "@/app/admin/papers/paper-form";
import { AdminShell } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "New Paper",
  description: "Create a new InterJudaica paper.",
};

export const runtime = "nodejs";

export default function NewPaperPage() {
  return (
    <AdminShell
      title="New paper"
      description="Create a community paper or public article."
    >
      <PaperForm />
    </AdminShell>
  );
}

