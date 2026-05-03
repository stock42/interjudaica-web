import type { Metadata } from "next";
import { AdminCollectionManager } from "@/app/admin/components/admin-collection-manager";
import { AdminShell } from "@/app/components/portal-ui";
import { InstructorStorage } from "@/services/instructors-storage";

export const metadata: Metadata = {
  title: "Instructors",
  description: "Manage InterJudaica instructors.",
};

export const runtime = "nodejs";

export default async function InstructorsPage() {
  const instructors = await InstructorStorage.list();

  return (
    <AdminShell
      title="Instructors"
      description="Manage instructors assigned to courses and public catalog records."
    >
      <AdminCollectionManager kind="instructors" initialItems={instructors} />
    </AdminShell>
  );
}

