"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TypeCourseCategory } from "@/models/course-categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CourseCategoryList({
  categories,
}: {
  categories: TypeCourseCategory[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState("");
  const [deletingUuid, setDeletingUuid] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) => {
        const matchesQuery =
          !normalizedQuery ||
          [category.name, category.slug, category.description]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesEnabled = !enabled || String(category.enabled) === enabled;

        return matchesQuery && matchesEnabled;
      }),
    [categories, enabled, normalizedQuery],
  );

  async function deleteCategory(category: TypeCourseCategory) {
    if (!category.uuid || !window.confirm(`Delete ${category.name}?`)) {
      return;
    }

    setDeletingUuid(category.uuid);

    const response = await fetch(
      `/api/admin/course-categories/${category.uuid}`,
      { method: "DELETE" },
    );

    setDeletingUuid("");

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/course-categories");
      return;
    }

    if (!response.ok) {
      window.alert("The category could not be deleted.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem]">
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Search categories
              <Input
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                type="search"
                placeholder="Name, slug, description"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              <span>Status</span>
              <Select value={enabled} onValueChange={(value) => setEnabled(value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Enabled</SelectItem>
                <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>

          <Button asChild size="lg" className="h-11">
            <Link href="/admin/course-categories/new">New category</Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase text-[var(--muted)]">
          <span className="rounded-full bg-[var(--paper)] px-3 py-1">
            {filteredCategories.length} visible
          </span>
          <span className="rounded-full bg-[var(--paper)] px-3 py-1">
            {categories.length} total
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Description</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                    colSpan={5}
                  >
                    No categories match the current search.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr
                    key={category.uuid}
                    className="border-t border-[var(--line)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--ink)]">
                        {category.name}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {category.slug}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
                        {category.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-4 text-[var(--muted)]">
                      {category.description || "Not set"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="xs" className="rounded-full">
                          <Link href={`/admin/course-categories/${category.uuid}`}>Edit</Link>
                        </Button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={deletingUuid === category.uuid}
                          onClick={() => deleteCategory(category)}
                        >
                          {deletingUuid === category.uuid
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

