import type { Metadata } from "next";
import { OperatorForm } from "@/app/admin/operators/operator-form";
import { AdminShell } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "New Operator",
  description: "Create a new InterJudaica operator.",
};

export const runtime = "nodejs";

export default function NewOperatorPage() {
  return (
    <AdminShell
      title="New operator"
      description="Create a staff account for backoffice access."
    >
      <OperatorForm />
    </AdminShell>
  );
}
