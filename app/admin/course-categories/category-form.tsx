"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TypeCourseCategory } from "@/models/course-categories";

const controlClass =
  "min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

const textareaClass =
  "min-h-28 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

type CategoryFormState = {
  name: string;
  description: string;
  enabled: boolean;
};

function slugPreview(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createFormState(category?: TypeCourseCategory): CategoryFormState {
  return {
    name: category?.name ?? "",
    description: category?.description ?? "",
    enabled: category?.enabled ?? true,
  };
}

export function CourseCategoryForm({
  category,
}: {
  category?: TypeCourseCategory;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(category));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(category?.uuid);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(
      isEditing
        ? `/api/admin/course-categories/${category?.uuid}`
        : "/api/admin/course-categories",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );

    setLoading(false);

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/course-categories");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The category could not be saved.");
      return;
    }

    router.push("/admin/course-categories");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {isEditing ? "Edit category" : "New category"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Slug is generated automatically from the category name.
          </p>
        </div>
        <Link
          href="/admin/course-categories"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
        >
          Back to list
        </Link>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="grid gap-2 md:col-span-2">
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Name
            <input
              className={controlClass}
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>
          <p className="text-xs font-semibold text-[var(--muted)]">
            Generated slug: {slugPreview(form.name) || "category-name"}
          </p>
        </div>

        <label className="flex items-center gap-3 self-end rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--ink)]">
          <input
            className="h-5 w-5 accent-[var(--sapphire)]"
            type="checkbox"
            checked={form.enabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                enabled: event.target.checked,
              }))
            }
          />
          Enabled
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
          Description
          <textarea
            className={textareaClass}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </label>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#07090c] transition hover:bg-[#ffd66b] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save category"}
          </button>
          <Link
            href="/admin/course-categories"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--paper)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

