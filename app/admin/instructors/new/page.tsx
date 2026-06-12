import type { Metadata } from "next";
import { InstructorForm } from "@/app/admin/instructors/instructor-form";
import { InstructorAiCreateButton } from "@/app/admin/instructors/instructor-ai-create-button";
import { AdminShell } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  title: "New Instructor",
  description: "Create a new InterJudaica instructor.",
};

export const runtime = "nodejs";

export default function NewInstructorPage() {
  return (
    <AdminShell
      title="New instructor"
      description="Create a teaching profile with public photo and biography."
    >
      <div className="mb-5">
        <InstructorAiCreateButton />
      </div>
      <InstructorForm />
    </AdminShell>
  );
}

