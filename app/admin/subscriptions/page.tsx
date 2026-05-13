import type { Metadata } from "next";
import { AdminShell, DataTable } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Admin Subscriptions",
  description: "Manage InterJudaica community subscriptions.",
};

export default function AdminSubscriptionsPage() {
  return (
    <AdminShell
      title="Community subscriptions"
      description="Review active, cancelled, and manual subscription states for the $19 USD/month community plan."
    >
      <DataTable
        columns={["Member", "Status", "Plan", "Renewal", "Source", "Notes"]}
        rows={[
          ["Miriam Stern", "Active", "$19 USD/month", "May 23, 2026", "Stripe", "Auto renewal"],
          ["David Levy", "Active", "$19 USD/month", "May 18, 2026", "Stripe", "Course discount used"],
          ["Leah Cohen", "Cancelled", "$19 USD/month", "Ended Apr 3, 2026", "Stripe", "Access expired"],
          ["Aaron Weiss", "Manual", "$19 USD/month", "Jun 1, 2026", "Admin", "Comped membership"],
        ]}
      />
    </AdminShell>
  );
}
