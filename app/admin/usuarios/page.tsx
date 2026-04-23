import type { Metadata } from "next";
import {
  AdminShell,
  ButtonLink,
  DataTable,
  Field,
} from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "Admin Users",
  description: "Manage InterJudaica users and student accounts.",
};

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="Users"
      description="Search registered students, inspect course purchases, review community status, and prepare CSV exports."
    >
      <div className="grid gap-5">
        <form className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-4 md:grid-cols-[1fr_14rem_10rem] md:items-end">
          <Field label="Search users" name="search" placeholder="Name or email" />
          <label className="grid gap-2 text-sm font-semibold">
            Segment
            <select className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3">
              <option>All users</option>
              <option>Students</option>
              <option>Community</option>
              <option>Banned</option>
            </select>
          </label>
          <ButtonLink href="#" tone="secondary">
            Export CSV
          </ButtonLink>
        </form>
        <DataTable
          columns={["User", "Email", "Role", "Courses", "Community", "Joined"]}
          rows={[
            ["Miriam Stern", "miriam@example.com", "Student", "2", "Active", "Jan 11, 2026"],
            ["David Levy", "david@example.com", "Student", "1", "Active", "Feb 4, 2026"],
            ["Rachel Benami", "rachel@example.com", "Community", "1", "Active", "Mar 16, 2026"],
            ["Admin User", "admin@interjudaica.com", "Admin", "0", "Staff", "Apr 1, 2026"],
          ]}
        />
      </div>
    </AdminShell>
  );
}
