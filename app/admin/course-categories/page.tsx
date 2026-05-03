import type { Metadata } from "next";
import { AdminCollectionManager } from "@/app/admin/components/admin-collection-manager";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseCategoryStorage } from "@/services/course-categories-storage";

export const metadata: Metadata = {
  title: "Course Categories",
  description: "Manage InterJudaica course categories.",
};

export const runtime = "nodejs";

export default async function CourseCategoriesPage() {
  const categories = await CourseCategoryStorage.list();

  return (
    <AdminShell
      title="Course categories"
      description="Manage the categories used to organize the course catalog."
    >
      <AdminCollectionManager
        kind="course-categories"
        initialItems={categories}
      />
    </AdminShell>
  );
}

