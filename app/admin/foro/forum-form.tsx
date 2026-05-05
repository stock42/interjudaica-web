"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TypeCourse } from "@/models/courses";
import type { TypeForumThread } from "@/models/forums";

const controlClass =
  "min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

const communityAreas = [
  "Community Forum",
  "Community Papers",
  "General Questions",
  "Announcements",
  "Technical Support",
];

type ForumFormState = {
  title: string;
  area: string;
  courseSlug: string;
  status: string;
  featured: boolean;
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

function createFormState(thread?: TypeForumThread): ForumFormState {
  return {
    title: thread?.title ?? "",
    area: thread?.area ?? "Community Forum",
    courseSlug: thread?.courseSlug ?? "",
    status: thread?.status ?? "open",
    featured: thread?.featured ?? false,
  };
}

export function ForumForm({
  courses,
  thread,
}: {
  courses: TypeCourse[];
  thread?: TypeForumThread;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(thread));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(thread?.uuid);
  const areaOptions = [
    ...communityAreas,
    ...courses.map((course) => course.title),
  ].filter((area, index, all) => all.indexOf(area) === index);

  function setField<K extends keyof ForumFormState>(
    name: K,
    value: ForumFormState[K],
  ) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(
      isEditing ? `/api/admin/forums/${thread?.uuid}` : "/api/admin/forums",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          area: form.area,
          courseSlug: form.courseSlug,
          status: form.status,
          featured: form.featured,
        }),
      },
    );

    setLoading(false);

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/foro");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The forum thread could not be saved.");
      return;
    }

    router.push("/admin/foro");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {isEditing ? "Edit thread" : "New thread"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Slug is generated automatically from the title.
          </p>
        </div>
        <Link
          href="/admin/foro"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
        >
          Back to list
        </Link>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="grid gap-2 md:col-span-2">
          <TextField
            label="Title"
            value={form.title}
            onChange={(value) => setField("title", value)}
          />
          <p className="text-xs font-semibold text-[var(--muted)]">
            Generated slug: {slugPreview(form.title) || "thread-title"}
          </p>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Area
          <select
            className={controlClass}
            value={form.area}
            onChange={(event) => setField("area", event.target.value)}
          >
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          <span className="text-xs font-semibold text-[var(--muted)]">
            Area groups the thread in the forum and moderation views.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Related course
          <select
            className={controlClass}
            value={form.courseSlug}
            onChange={(event) => setField("courseSlug", event.target.value)}
          >
            <option value="">Community forum</option>
            {courses.map((course) => (
              <option key={course.uuid} value={course.slug}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Status
          <select
            className={controlClass}
            value={form.status}
            onChange={(event) => setField("status", event.target.value)}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="flex items-center gap-3 self-end rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--ink)]">
          <input
            className="h-5 w-5 accent-[var(--sapphire)]"
            type="checkbox"
            checked={form.featured}
            onChange={(event) => setField("featured", event.target.checked)}
          />
          Featured
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
            {loading ? "Saving..." : "Save thread"}
          </button>
          <Link
            href="/admin/foro"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--paper)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text";
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
      {label}
      <input
        className={controlClass}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
