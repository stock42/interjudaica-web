import type { Metadata } from "next";
import { ForumList } from "@/app/admin/foro/forum-list";
import { AdminShell } from "@/app/components/portal-ui";
import { ForumStorage } from "@/services/forums-storage";

export const metadata: Metadata = {
  title: "Admin Forum",
  description: "Moderate InterJudaica course and community forums.",
};

export const runtime = "nodejs";

export default async function AdminForumPage() {
  const forums = await ForumStorage.list();

  return (
    <AdminShell
      title="Forum moderation"
      description="Review course and community threads, hide posts, delete spam, and mark conversations as featured."
    >
      <ForumList threads={forums} />
    </AdminShell>
  );
}
