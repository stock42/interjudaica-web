import type { Metadata } from "next";
import { AdminCollectionManager } from "@/app/admin/components/admin-collection-manager";
import { AdminShell } from "@/app/components/portal-ui";
import { PaperStorage } from "@/services/papers-storage";

export const metadata: Metadata = {
  title: "Admin Papers",
  description: "Manage Rabbi Yattah papers for community members.",
};

export const runtime = "nodejs";

export default async function AdminPapersPage() {
  const papers = await PaperStorage.list();

  return (
    <AdminShell
      title="Papers"
      description="Create, edit, and publish member-only papers and articles from Rabbi Yattah."
    >
      <AdminCollectionManager kind="papers" initialItems={papers} />
    </AdminShell>
  );
}
