import type { Metadata } from "next";
import { CourseCategoryList } from "@/app/admin/course-categories/category-list";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseCategoryStorage } from "@/services/course-categories-storage";
import { AiCreateCategoryButton } from "@/app/admin/course-categories/ai-create-category-button";

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
      <div className="mb-6">
        <AiCreateCategoryButton />
      </div>
      <CourseCategoryList categories={categories} />
    </AdminShell>
  );
}

