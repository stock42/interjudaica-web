import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OperatorForm } from "@/app/admin/operators/operator-form";
import { AdminShell } from "@/app/components/portal-ui";
import { OperatorStorage } from "@/services/operators-storage";

export const metadata: Metadata = {
  title: "Edit Operator",
  description: "Edit an InterJudaica operator.",
};

export const runtime = "nodejs";

export default async function EditOperatorPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const operator = await OperatorStorage.get(uuid);

  if (!operator) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit operator"
      description="Update staff profile, access level, and password."
    >
      <OperatorForm operator={operator} />
    </AdminShell>
  );
}
