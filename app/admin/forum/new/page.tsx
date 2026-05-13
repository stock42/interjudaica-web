import type { Metadata } from "next";
import { ForumForm } from "@/app/admin/forum/forum-form";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseStorage } from "@/services/courses-storage";

export const metadata: Metadata = {
  title: "New Forum Thread",
  description: "Create a new InterJudaica forum thread.",
};

export const runtime = "nodejs";

export default async function NewForumThreadPage() {
  const courses = await CourseStorage.list();

  return (
    <AdminShell
      title="New thread"
      description="Create a course or community forum thread."
    >
      <ForumForm courses={courses} />
    </AdminShell>
  );
}

