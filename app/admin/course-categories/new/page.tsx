import type { Metadata } from "next";
import { CourseCategoryForm } from "@/app/admin/course-categories/category-form";
import { AdminShell } from "@/app/components/portal-ui";
import { AiCreateCategoryButton } from "@/app/admin/course-categories/ai-create-category-button";

export const metadata: Metadata = {
  title: "New Course Category",
  description: "Create a new InterJudaica course category.",
};

export const runtime = "nodejs";

export default function NewCourseCategoryPage() {
  return (
    <AdminShell
      title="New category"
      description="Create a course category for catalog organization."
    >
      <div className="mb-6">
        <AiCreateCategoryButton />
      </div>
      <CourseCategoryForm />
    </AdminShell>
  );
}

