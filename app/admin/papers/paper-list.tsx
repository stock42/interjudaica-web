"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TypePaper } from "@/models/papers";

export function PaperList({ papers }: { papers: TypePaper[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [deletingUuid, setDeletingUuid] = useState("");
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
              <input
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                type="search"
                placeholder="Title, category, author"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Status
              <select
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Visibility
              <select
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
              >
                <option value="">All</option>
                <option value="public">Public</option>
                <option value="community">Community</option>
                <option value="private">Private</option>
              </select>
            </label>
          </form>
          <Link
            href="/admin/papers/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#07090c] transition hover:bg-[#ffd66b]"
          >
            New paper
          </Link>
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
                        <Link
                          href={`/admin/papers/${paper.uuid}`}
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-bold transition hover:bg-[var(--paper)]"
                        >
                          Edit
                        </Link>
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
    </div>
  );
}

