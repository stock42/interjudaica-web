import type { Metadata } from "next";
import { PaperForm } from "@/app/admin/papers/paper-form";
import { AdminShell } from "@/app/components/portal-ui";
import { PaperCategoryStorage } from "@/services/paper-categories-storage";

export const metadata: Metadata = {
  title: "New Paper",
  description: "Create a new InterJudaica paper.",
};

export const runtime = "nodejs";

export default async function NewPaperPage() {
  const categories = await PaperCategoryStorage.list();

  return (
    <AdminShell
      title="New paper"
      description="Create a community paper or public article."
    >
      <PaperForm categories={categories} />
    </AdminShell>
  );
}
