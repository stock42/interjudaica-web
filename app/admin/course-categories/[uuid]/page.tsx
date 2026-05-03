import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseCategoryForm } from "@/app/admin/course-categories/category-form";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseCategoryStorage } from "@/services/course-categories-storage";

export const metadata: Metadata = {
  title: "Edit Course Category",
  description: "Edit an InterJudaica course category.",
};

export const runtime = "nodejs";

export default async function EditCourseCategoryPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const category = await CourseCategoryStorage.get(uuid);

  if (!category) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit category"
      description="Update category naming, availability, and description."
    >
      <CourseCategoryForm category={category} />
    </AdminShell>
  );
}

