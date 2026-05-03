"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TypeCourse } from "@/models/courses";

const controlClass =
  "min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

const textareaClass =
  "min-h-28 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

type CourseFormState = {
  title: string;
  slug: string;
  category: string;
  level: string;
  price: string;
  communityPrice: string;
  duration: string;
  startDate: string;
  endDate: string;
  instructor: string;
  status: string;
  stripePaymentLink: string;
  summary: string;
  description: string;
  includes: string;
  outcomes: string;
};

function createFormState(course?: TypeCourse): CourseFormState {
  return {
    title: course?.title ?? "",
    slug: course?.slug ?? "",
    category: course?.category ?? "",
    level: course?.level ?? "Beginner",
    price: String(course?.price ?? 0),
    communityPrice: String(course?.communityPrice ?? 0),
    duration: course?.duration ?? "",
    startDate: course?.startDate ?? "",
    endDate: course?.endDate ?? "",
    instructor: course?.instructor ?? "Rabbi Yattah",
    status: course?.status ?? "draft",
    stripePaymentLink: course?.stripePaymentLink ?? "",
    summary: course?.summary ?? "",
    description: course?.description ?? "",
    includes: course?.includes?.join("\n") ?? "",
    outcomes: course?.outcomes?.join("\n") ?? "",
  };
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function CourseForm({ course }: { course?: TypeCourse }) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(course));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(course?.uuid);

  function setField(name: keyof CourseFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(
      isEditing ? `/api/admin/courses/${course?.uuid}` : "/api/admin/courses",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          category: form.category,
          level: form.level,
          price: Number(form.price || 0),
          communityPrice: Number(form.communityPrice || 0),
          duration: form.duration,
          startDate: form.startDate,
          endDate: form.endDate,
          instructor: form.instructor,
          status: form.status,
          stripePaymentLink: form.stripePaymentLink,
          summary: form.summary,
          description: form.description,
          includes: lines(form.includes),
          outcomes: lines(form.outcomes),
        }),
      },
    );

    setLoading(false);

    if (response.status === 401) {
      window.location.assign("/login?next=/admin/cursos");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The course could not be saved.");
      return;
    }

    router.push("/admin/cursos");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {isEditing ? "Edit course" : "New course"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isEditing
              ? "Update catalog, pricing, visibility, and course materials."
              : "Create the catalog record, then publish it when it is ready."}
          </p>
        </div>
        <Link
          href="/admin/cursos"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
        >
          Back to list
        </Link>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <TextField label="Title" value={form.title} onChange={(value) => setField("title", value)} />
        <TextField label="Slug" value={form.slug} onChange={(value) => setField("slug", value)} />
        <TextField label="Category" value={form.category} onChange={(value) => setField("category", value)} />
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Level
          <select className={controlClass} value={form.level} onChange={(event) => setField("level", event.target.value)}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </label>
        <TextField label="Price" type="number" value={form.price} onChange={(value) => setField("price", value)} />
        <TextField label="Community price" type="number" value={form.communityPrice} onChange={(value) => setField("communityPrice", value)} />
        <TextField label="Duration" value={form.duration} onChange={(value) => setField("duration", value)} />
        <TextField label="Start date" value={form.startDate} onChange={(value) => setField("startDate", value)} />
        <TextField label="End date" value={form.endDate} onChange={(value) => setField("endDate", value)} />
        <TextField label="Instructor" value={form.instructor} onChange={(value) => setField("instructor", value)} />
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Status
          <select className={controlClass} value={form.status} onChange={(event) => setField("status", event.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <TextField label="Stripe link" value={form.stripePaymentLink} onChange={(value) => setField("stripePaymentLink", value)} />
        <TextareaField label="Summary" value={form.summary} onChange={(value) => setField("summary", value)} />
        <TextareaField label="Description" value={form.description} onChange={(value) => setField("description", value)} />
        <TextareaField label="Includes" value={form.includes} onChange={(value) => setField("includes", value)} />
        <TextareaField label="Outcomes" value={form.outcomes} onChange={(value) => setField("outcomes", value)} />

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--sapphire)] hover:bg-[var(--sapphire)] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save course"}
          </button>
          <Link
            href="/admin/cursos"
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
  type?: "text" | "number";
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

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
      {label}
      <textarea
        className={textareaClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

