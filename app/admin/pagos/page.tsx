import type { Metadata } from "next";
import { AdminShell, DataTable } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Admin Payments",
  description: "Manage InterJudaica Stripe transactions.",
};

export default function AdminPaymentsPage() {
  return (
    <AdminShell
      title="Payments"
      description="Track one-time course purchases, recurring community subscriptions, refunds, and reconciliation notes."
    >
      <DataTable
        columns={["Payment", "User", "Type", "Amount", "Status", "Date"]}
        rows={[
          ["pi_2841", "Miriam Stern", "Course", "$180 USD", "Paid", "Apr 21, 2026"],
          ["sub_1028", "David Levy", "Community", "$19 USD", "Paid", "Apr 20, 2026"],
          ["pi_2817", "Rachel Benami", "Course", "$195 USD", "Paid", "Apr 19, 2026"],
          ["re_0921", "Leah Cohen", "Refund", "$19 USD", "Pending", "Apr 18, 2026"],
        ]}
      />
    </AdminShell>
  );
}
