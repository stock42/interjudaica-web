import type { Metadata } from "next";
import { PaperCategoryList } from "@/app/admin/paper-categories/category-list";
import { AdminShell } from "@/app/components/portal-ui";
import { PaperCategoryStorage } from "@/services/paper-categories-storage";

export const metadata: Metadata = {
  title: "Paper Categories",
  description: "Manage InterJudaica paper categories.",
};

export const runtime = "nodejs";

export default async function PaperCategoriesPage() {
  const categories = await PaperCategoryStorage.list();

  return (
    <AdminShell
      title="Paper categories"
      description="Manage the categories used to organize community papers."
    >
      <PaperCategoryList categories={categories} />
    </AdminShell>
  );
}
