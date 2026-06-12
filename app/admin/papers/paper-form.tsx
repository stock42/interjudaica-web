"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { TextField, TextareaField, DateField, FieldWrapper } from "@/app/components/form-fields";
import type { TypePaperCategory } from "@/models/paper-categories";
import type { TypePaper } from "@/models/papers";


type PaperFormState = {
  title: string;
  categoryUuid: string;
  date: string;
  author: string;
  status: string;
  visibility: string;
  summary: string;
  content: string;
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

function createFormState(
  paper?: TypePaper,
  categories: TypePaperCategory[] = [],
): PaperFormState {
  const matchingCategory =
    paper && !paper.categoryUuid
      ? categories.find(
          (category) =>
            category.slug === paper.categorySlug ||
            category.name.toLowerCase() === paper.category.toLowerCase(),
        )
      : undefined;

  return {
    title: paper?.title ?? "",
    categoryUuid: paper?.categoryUuid ?? matchingCategory?.uuid ?? "",
    date: paper?.date ?? "",
    author: paper?.author ?? "Ernesto Yattah",
    status: paper?.status ?? "draft",
    visibility: paper?.visibility ?? "community",
    summary: paper?.summary ?? "",
    content: paper?.content ?? "",
  };
}

export function PaperForm({
  categories,
  paper,
}: {
  categories: TypePaperCategory[];
  paper?: TypePaper;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(paper, categories));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(paper?.uuid);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.uuid === form.categoryUuid),
    [categories, form.categoryUuid],
  );
  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.enabled || category.uuid === form.categoryUuid,
      ),
    [categories, form.categoryUuid],
  );
  const generatedSlug = slugPreview(form.title);

  function setField(name: keyof PaperFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(
      isEditing ? `/api/admin/papers/${paper?.uuid}` : "/api/admin/papers",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          categoryUuid: selectedCategory?.uuid ?? "",
          category: selectedCategory?.name ?? "",
          categorySlug: selectedCategory?.slug ?? "",
          date: form.date,
          author: form.author,
          status: form.status,
          visibility: form.visibility,
          summary: form.summary,
          content: form.content,
        }),
      },
    );

    setLoading(false);

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/papers");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The paper could not be saved.");
      return;
    }

    router.push("/admin/papers");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {isEditing ? "Edit paper" : "New paper"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Slug is generated automatically from the title.
          </p>
        </div>
        <Link
          href="/admin/papers"
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
            Generated slug: {generatedSlug || "paper-title"}
          </p>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <Label>Category</Label>
          <Select
            value={form.categoryUuid || ""}
            onValueChange={(value) => setField("categoryUuid", value)}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue
                placeholder={
                  availableCategories.length
                    ? "Select a category"
                    : "Create a category first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableCategories
                .filter((category) => Boolean(category.uuid))
                .map((category) => (
                  <SelectItem key={category.uuid} value={category.uuid ?? ""}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Link
            href="/admin/paper-categories"
            className="text-xs font-bold text-[var(--sapphire)] underline underline-offset-4"
          >
            Manage categories
          </Link>
        </div>
        <TextField
          label="Author"
          value={form.author}
          onChange={(value) => setField("author", value)}
        />
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Date
          <Input
            className="h-11 w-full"
            type="date"
            value={form.date}
            onChange={(event) => setField("date", event.target.value)}
          />
        </label>
        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value) => setField("status", value)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <Label>Visibility</Label>
          <Select value={form.visibility} onValueChange={(value) => setField("visibility", value)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="community">Community</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TextareaField
          label="Summary"
          value={form.summary}
          onChange={(value) => setField("summary", value)}
        />
        <TextareaField
          label="Content"
          value={form.content}
          onChange={(value) => setField("content", value)}
        />

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save paper"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/papers">Cancel</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}

