import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaperForm } from "@/app/admin/papers/paper-form";
import { AdminShell } from "@/app/components/portal-ui";
import { PaperStorage } from "@/services/papers-storage";

export const metadata: Metadata = {
  title: "Edit Paper",
  description: "Edit an InterJudaica paper.",
};

export const runtime = "nodejs";

export default async function EditPaperPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const paper = await PaperStorage.get(uuid);

  if (!paper) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit paper"
      description="Update article metadata, visibility, and content."
    >
      <PaperForm paper={paper} />
    </AdminShell>
  );
}

