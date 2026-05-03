import type { Metadata } from "next";
import { CourseCategoryList } from "@/app/admin/course-categories/category-list";
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
      <CourseCategoryList categories={categories} />
    </AdminShell>
  );
}

