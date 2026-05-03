import type { Metadata } from "next";
import { CourseCategoryForm } from "@/app/admin/course-categories/category-form";
import { AdminShell } from "@/app/components/portal-ui";

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
      <CourseCategoryForm />
    </AdminShell>
  );
}

