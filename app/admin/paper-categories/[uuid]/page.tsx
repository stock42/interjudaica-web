import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaperCategoryForm } from "@/app/admin/paper-categories/category-form";
import { AdminShell } from "@/app/components/portal-ui";
import { PaperCategoryStorage } from "@/services/paper-categories-storage";

export const metadata: Metadata = {
  title: "Edit Paper Category",
  description: "Edit an InterJudaica paper category.",
};

export const runtime = "nodejs";

export default async function EditPaperCategoryPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const category = await PaperCategoryStorage.get(uuid);

  if (!category) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit category"
      description="Update category naming, availability, and description."
    >
      <PaperCategoryForm category={category} />
    </AdminShell>
  );
}
