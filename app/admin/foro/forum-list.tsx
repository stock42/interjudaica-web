"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TypeForumThread } from "@/models/forums";

export function ForumList({ threads }: { threads: TypeForumThread[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [deletingUuid, setDeletingUuid] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredThreads = useMemo(
    () =>
      threads.filter((thread) => {
        const matchesQuery =
          !normalizedQuery ||
          [thread.title, thread.area, thread.courseSlug, thread.slug]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesStatus = !status || thread.status === status;
        const matchesFeatured =
          !featured || String(thread.featured) === featured;

        return matchesQuery && matchesStatus && matchesFeatured;
      }),
    [featured, normalizedQuery, status, threads],
  );

  async function deleteThread(thread: TypeForumThread) {
    if (!thread.uuid || !window.confirm(`Delete ${thread.title}?`)) {
      return;
    }

    setDeletingUuid(thread.uuid);

    const response = await fetch(`/api/admin/forums/${thread.uuid}`, {
      method: "DELETE",
    });

    setDeletingUuid("");

    if (response.status === 401) {
      window.location.assign("/login?next=/admin/foro");
      return;
    }

    if (!response.ok) {
      window.alert("The forum thread could not be deleted.");
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
              Search forum
              <input
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                type="search"
                placeholder="Title, area, course"
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
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Featured
              <select
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                value={featured}
                onChange={(event) => setFeatured(event.target.value)}
              >
                <option value="">All</option>
                <option value="true">Featured</option>
                <option value="false">Not featured</option>
              </select>
            </label>
          </form>
          <Link
            href="/admin/foro/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--sapphire)] hover:bg-[var(--sapphire)]"
          >
            New thread
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-bold">Thread</th>
                <th className="px-4 py-3 font-bold">Area</th>
                <th className="px-4 py-3 font-bold">Course</th>
                <th className="px-4 py-3 font-bold">Replies</th>
                <th className="px-4 py-3 font-bold">Unread</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Featured</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredThreads.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                    colSpan={8}
                  >
                    No forum threads match the current search.
                  </td>
                </tr>
              ) : (
                filteredThreads.map((thread) => (
                  <tr
                    key={thread.uuid}
                    className="border-t border-[var(--line)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--ink)]">
                        {thread.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {thread.slug}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {thread.area}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {thread.courseSlug || "Community"}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {thread.repliesCount}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {thread.unreadCount}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
                        {thread.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {thread.featured ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/foro/${thread.uuid}`}
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-bold transition hover:bg-[var(--paper)]"
                        >
                          Edit
                        </Link>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={deletingUuid === thread.uuid}
                          onClick={() => deleteThread(thread)}
                        >
                          {deletingUuid === thread.uuid
                            ? "Deleting"
                            : "Delete"}
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

