import type { Metadata } from "next";
import {
  AdminShell,
  AdminStatGrid,
  DataTable,
} from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Admin",
  description: "InterJudaica admin dashboard.",
};

export default function AdminPage() {
  return (
    <AdminShell
      title="Admin overview"
      description="Monitor users, community subscriptions, course sales, Stripe revenue, and live learning activity."
    >
      <div className="grid gap-6">
        <AdminStatGrid />
        <DataTable
          columns={["Area", "Status", "Owner", "Next step"]}
          rows={[
            ["Courses", "3 active cohorts", "Education", "Confirm Zoom links"],
            ["Community", "396 active members", "Membership", "Publish April paper"],
            ["Forum", "56 open threads", "Moderation", "Review flagged posts"],
            ["Payments", "$28.4k gross", "Finance", "Reconcile refunds"],
          ]}
        />
      </div>
    </AdminShell>
  );
}
