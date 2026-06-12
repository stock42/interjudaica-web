"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";
import AiCreateModal from "@/app/admin/components/ai-create-modal";

import type { TypePaper } from "@/models/papers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PaperList({ papers }: { papers: TypePaper[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [deletingUuid, setDeletingUuid] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredPapers = useMemo(
    () =>
      papers.filter((paper) => {
        const matchesQuery =
          !normalizedQuery ||
          [paper.title, paper.category, paper.author, paper.slug]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesStatus = !status || paper.status === status;
        const matchesVisibility =
          !visibility || paper.visibility === visibility;

        return matchesQuery && matchesStatus && matchesVisibility;
      }),
    [normalizedQuery, papers, status, visibility],
  );

  async function deletePaper(paper: TypePaper) {
    if (!paper.uuid || !window.confirm(`Delete ${paper.title}?`)) {
      return;
    }

    setDeletingUuid(paper.uuid);

    const response = await fetch(`/api/admin/papers/${paper.uuid}`, {
      method: "DELETE",
    });

    setDeletingUuid("");

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/papers");
      return;
    }

    if (!response.ok) {
      window.alert("The paper could not be deleted.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem_12rem]">
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Search papers
              <Input
                className={adminTextControlClass}
                type="search"
                placeholder="Title, category, author"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              <span>Status</span>
              <Select value={status} onValueChange={(value) => setStatus(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              <span>Visibility</span>
              <Select value={visibility} onValueChange={(value) => setVisibility(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-11 border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/10"
              onClick={() => setAiOpen(true)}
            >
              <Sparkles className="size-4" data-icon="inline-start" />
              AI create
            </Button>
            <Button asChild size="lg" className="h-11">
              <Link href="/admin/papers/new">New paper</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-bold">Paper</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Author</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Visibility</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPapers.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                    colSpan={7}
                  >
                    No papers match the current search.
                  </td>
                </tr>
              ) : (
                filteredPapers.map((paper) => (
                  <tr
                    key={paper.uuid}
                    className="border-t border-[var(--line)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--ink)]">
                        {paper.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {paper.slug}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {paper.category}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {paper.author}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {paper.date || "Not set"}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {paper.visibility}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
                        {paper.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="xs" className="rounded-full">
                          <Link href={`/admin/papers/${paper.uuid}`}>Edit</Link>
                        </Button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={deletingUuid === paper.uuid}
                          onClick={() => deletePaper(paper)}
                        >
                          {deletingUuid === paper.uuid ? "Deleting" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AiCreateModal
        entityType="paper"
        entityName="Paper"
        open={aiOpen}
        onOpenChange={setAiOpen}
        systemPrompt={`You are creating a Jewish studies paper/article for the InterJudaica platform. Return a JSON object with these fields:
- title (string, required, min 2 chars): The paper title
- categoryUuid (string, optional): UUID of an existing paper category
- category (string): The paper category name
- date (string, format YYYY-MM-DD): Publication date
- summary (string): A brief summary/abstract
- content (string, markdown): The full paper content in markdown
- author (string, default "Ernesto Yattah"): The author name
- status (string, "draft"|"published"|"archived", default "draft")
- visibility (string, "public"|"community"|"private", default "community")
Generate rich, academic-quality Jewish content. Make the paper substantive with detailed markdown content.`}
        onCreate={async (data) => {
          const res = await fetch("/api/admin/papers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
          if (!res.ok) {
            const d = await res.json().catch(() => ({}))
            throw new Error(d.error ?? "Failed to create paper")
          }
          router.push("/admin/papers")
          router.refresh()
        }}
      />
    </div>
  );
}

