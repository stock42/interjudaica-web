import type { Metadata } from "next";
import {
  AdminShell,
  ButtonLink,
  DataTable,
} from "@/app/components/portal-ui";
import { papers } from "@/app/lib/content";

export const metadata: Metadata = {
  title: "Admin Papers",
  description: "Manage Rabbi Yattah papers for community members.",
};

export default function AdminPapersPage() {
  return (
    <AdminShell
      title="Papers"
      description="Create, edit, and publish member-only papers and articles from Rabbi Yattah."
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Content library
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {papers.length} papers available to members
            </p>
          </div>
          <ButtonLink href="#" tone="primary">
            New paper
          </ButtonLink>
        </div>
        <DataTable
          columns={["Title", "Category", "Date", "Visibility", "Status"]}
          rows={papers.map((paper) => [
            paper.title,
            paper.category,
            paper.date,
            "Community only",
            "Published",
          ])}
        />
      </div>
    </AdminShell>
  );
}
