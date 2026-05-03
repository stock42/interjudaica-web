import type { Metadata } from "next";
import { OperatorList } from "@/app/admin/operators/operator-list";
import { AdminShell } from "@/app/components/portal-ui";
import { OperatorStorage } from "@/services/operators-storage";

export const metadata: Metadata = {
  title: "Operators",
  description: "Manage InterJudaica backoffice operators.",
};

export const runtime = "nodejs";

export default async function OperatorsPage() {
  const operators = await OperatorStorage.list();

  return (
    <AdminShell
      title="Operators"
      description="Manage staff accounts with access to the backoffice."
    >
      <OperatorList operators={operators} />
    </AdminShell>
  );
}
