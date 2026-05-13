import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForumForm } from "@/app/admin/forum/forum-form";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseStorage } from "@/services/courses-storage";
import { ForumStorage } from "@/services/forums-storage";

export const metadata: Metadata = {
  title: "Edit Forum Thread",
  description: "Edit an InterJudaica forum thread.",
};

export const runtime = "nodejs";

export default async function EditForumThreadPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const [courses, thread] = await Promise.all([
    CourseStorage.list(),
    ForumStorage.get(uuid),
  ]);

  if (!thread) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit thread"
      description="Update thread metadata, visibility, and moderation state."
    >
      <ForumForm courses={courses} thread={thread} />
    </AdminShell>
  );
}

