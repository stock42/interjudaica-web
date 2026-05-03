import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstructorForm } from "@/app/admin/instructors/instructor-form";
import { AdminShell } from "@/app/components/portal-ui";
import { InstructorStorage } from "@/services/instructors-storage";

export const metadata: Metadata = {
  title: "Edit Instructor",
  description: "Edit an InterJudaica instructor.",
};

export const runtime = "nodejs";

export default async function EditInstructorPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const instructor = await InstructorStorage.get(uuid);

  if (!instructor) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit instructor"
      description="Update the public instructor profile and photo."
    >
      <InstructorForm instructor={instructor} />
    </AdminShell>
  );
}

