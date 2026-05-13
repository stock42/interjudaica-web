import type { Metadata } from "next";
import { AdminCollectionManager } from "@/app/admin/components/admin-collection-manager";
import { AdminShell } from "@/app/components/portal-ui";
import { UserStorage } from "@/services/users-storage";

export const metadata: Metadata = {
  title: "Admin Users",
  description: "Manage InterJudaica users and student accounts.",
};

export const runtime = "nodejs";

export default async function AdminUsersPage() {
  const users = await UserStorage.list();

  return (
    <AdminShell
      title="Users"
      description="Search registered students, inspect course purchases, review community status, and prepare CSV exports."
    >
      <AdminCollectionManager kind="users" initialItems={users} />
    </AdminShell>
  );
}
