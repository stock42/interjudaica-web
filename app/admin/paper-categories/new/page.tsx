import type { Metadata } from "next";
import { PaperCategoryForm } from "@/app/admin/paper-categories/category-form";
import { AdminShell } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "New Paper Category",
  description: "Create a new InterJudaica paper category.",
};

export const runtime = "nodejs";

export default function NewPaperCategoryPage() {
  return (
    <AdminShell
      title="New category"
      description="Create a paper category for article organization."
    >
      <PaperCategoryForm />
    </AdminShell>
  );
}
