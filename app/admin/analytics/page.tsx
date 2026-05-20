import type { Metadata } from "next";
import { AdminShell, DataTable } from "@/app/components/portal-ui";
import { BookSaleStorage } from "@/services/book-sales-storage";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { CoursePaymentStorage } from "@/services/course-payments-storage";
import { ErrorEventStorage } from "@/services/error-events-storage";
import { ForumStorage } from "@/services/forums-storage";
import { getIsoDaysAgo } from "@/lib/time";

export const metadata: Metadata = {
  title: "Admin Analytics",
  description: "InterJudaica analytics and retention reporting.",
};

export const runtime = "nodejs";

export default async function AdminAnalyticsPage() {
  const [payments, bookSales, communityUsers, forums, recentErrors] = await Promise.all([
    CoursePaymentStorage.list(),
    BookSaleStorage.list(),
    CommunityUserStorage.list(),
    ForumStorage.list(),
    ErrorEventStorage.listRecent(10),
  ]);

  const last24h = getIsoDaysAgo(1);
  const last7d = getIsoDaysAgo(7);
  const [errors24h, errors7d] = await Promise.all([
    ErrorEventStorage.countSince(last24h),
    ErrorEventStorage.countSince(last7d),
  ]);

  const paidCoursePayments = payments.filter((payment) => payment.status === "paid");
  const paidBookSales = bookSales.filter((sale) => sale.status === "paid");
  const activeCommunityUsers = communityUsers.filter((user) => user.status === "active");
  const subscriptionManagedUsers = communityUsers.filter((user) => Boolean(user.stripeSubscriptionId));

  return (
    <AdminShell
      title="Analytics"
      description="Review live payments, memberships, forum activity, and recent production errors."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          ["Paid course payments", String(paidCoursePayments.length), `${payments.length} total records`],
          ["Active community users", String(activeCommunityUsers.length), `${subscriptionManagedUsers.length} managed by Stripe`],
          ["Recent errors", String(errors24h), `${errors7d} in the last 7 days`],
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
            ["Course payments", String(paidCoursePayments.length), String(payments.length - paidCoursePayments.length), `${Math.round((paidCoursePayments.length / Math.max(payments.length, 1)) * 100)}% paid`],
            ["Book sales", String(paidBookSales.length), String(bookSales.length - paidBookSales.length), `${Math.round((paidBookSales.length / Math.max(bookSales.length, 1)) * 100)}% paid`],
            ["Forum threads", String(forums.length), String(forums.filter((thread) => thread.status === "open").length), `${forums.filter((thread) => thread.area === "Community Forum").length} community`],
            ["Monitoring", String(errors24h), String(errors7d), "24h / 7d errors"],
          ]}
        />
      </div>

      <div className="mt-6">
        <DataTable
          columns={["When", "Level", "Event", "Route", "Message"]}
          rows={recentErrors.length > 0
            ? recentErrors.map((item) => [
                new Date(item.createdAt).toLocaleString("en-US"),
                item.level,
                item.event,
                item.route || "-",
                item.message,
              ])
            : [["-", "info", "no_recent_errors", "-", "No errors captured yet"]]}
        />
      </div>
    </AdminShell>
  );
}
