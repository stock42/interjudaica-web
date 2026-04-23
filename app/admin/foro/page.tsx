import type { Metadata } from "next";
import { AdminShell, DataTable } from "@/app/components/portal-ui";
import { forumThreads } from "@/app/lib/content";

export const metadata: Metadata = {
  title: "Admin Forum",
  description: "Moderate InterJudaica course and community forums.",
};

export default function AdminForumPage() {
  return (
    <AdminShell
      title="Forum moderation"
      description="Review course and community threads, hide posts, delete spam, and mark conversations as featured."
    >
      <DataTable
        columns={["Thread", "Area", "Replies", "Unread", "Moderation"]}
        rows={forumThreads.map((thread) => [
          thread.title,
          thread.area,
          String(thread.replies),
          String(thread.unread),
          "Visible",
        ])}
      />
    </AdminShell>
  );
}
