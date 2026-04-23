import type { Metadata } from "next";
import { AdminShell, DataTable } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Admin Analytics",
  description: "InterJudaica analytics and retention reporting.",
};

export default function AdminAnalyticsPage() {
  return (
    <AdminShell
      title="Analytics"
      description="Review internal reports for course sales, retention, community growth, and engagement trends."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          ["Top course", "Foundations of Jewish Thought", "54 sales"],
          ["Retention", "82%", "Community month two"],
          ["Forum activity", "312", "Posts this month"],
        ].map(([label, value, note]) => (
          <div
            key={label}
            className="rounded-lg border border-[var(--line)] bg-white p-5"
          >
            <p className="text-sm font-semibold text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-3 font-display text-3xl font-semibold">
              {value}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">{note}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <DataTable
          columns={["Metric", "Current", "Previous", "Change"]}
          rows={[
            ["Course conversion", "8.4%", "7.1%", "+1.3%"],
            ["Community churn", "3.2%", "4.8%", "-1.6%"],
            ["Forum replies per student", "2.9", "2.4", "+0.5"],
            ["Certificate completion", "64%", "58%", "+6%"],
          ]}
        />
      </div>
    </AdminShell>
  );
}
