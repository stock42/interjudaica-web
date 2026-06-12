"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextareaField, DateField, FieldWrapper } from "@/app/components/form-fields";
import type { TypeCourseCategory } from "@/models/course-categories";
import type { TypeCourse } from "@/models/courses";
import type { TypeInstructor } from "@/models/instructors";


type CourseFormState = {
  title: string;
  categoryUuid: string;
  level: string;
  price: string;
  communityPrice: string;
  durationHours: string;
  startDate: string;
  endDate: string;
  instructorUuid: string;
  maxStudents: string;
  status: string;
  stripePaymentLink: string;
  thumbnailImageUrl: string;
  coverImageUrl: string;
  summary: string;
  description: string;
  includes: string;
  outcomes: string;
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

function createFormState(course?: TypeCourse): CourseFormState {
  return {
    title: course?.title ?? "",
    categoryUuid: course?.categoryUuid ?? "",
    level: course?.level ?? "Beginner",
    price: String(course?.price ?? 0),
    communityPrice: String(course?.communityPrice ?? 0),
    durationHours: String(course?.durationHours ?? 0),
    startDate: course?.startDate ?? "",
    endDate: course?.endDate ?? "",
    instructorUuid: course?.instructorUuid ?? "",
    maxStudents: String(course?.maxStudents ?? 0),
    status: course?.status ?? "draft",
    stripePaymentLink: course?.stripePaymentLink ?? "",
    thumbnailImageUrl: course?.thumbnailImageUrl ?? "",
    coverImageUrl: course?.coverImageUrl ?? "",
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

export function CourseForm({
  categories,
  course,
  instructors,
}: {
  categories: TypeCourseCategory[];
  course?: TypeCourse;
  instructors: TypeInstructor[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(course));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<"thumbnail" | "cover" | "">("");
  const [error, setError] = useState("");
  const isEditing = Boolean(course?.uuid);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.uuid === form.categoryUuid),
    [categories, form.categoryUuid],
  );
  const selectedInstructor = useMemo(
    () =>
      instructors.find((instructor) => instructor.uuid === form.instructorUuid),
    [form.instructorUuid, instructors],
  );
  const generatedSlug = slugPreview(form.title);

  function setField(name: keyof CourseFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function uploadImage(
    event: ChangeEvent<HTMLInputElement>,
    kind: "thumbnail" | "cover",
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(kind);
    setError("");

    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", kind);
    if (course?.uuid) {
      formData.set("courseUuid", course.uuid);
    }

    const response = await fetch("/api/admin/uploads/course-image", {
      method: "POST",
      body: formData,
    });

    setUploading("");
    event.target.value = "";

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/courses");
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "The image could not be uploaded.");
      return;
    }

    setField(kind === "thumbnail" ? "thumbnailImageUrl" : "coverImageUrl", data.url);
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
          categoryUuid: selectedCategory?.uuid ?? "",
          category: selectedCategory?.name ?? "",
          categorySlug: selectedCategory?.slug ?? "",
          level: form.level,
          price: Number(form.price || 0),
          communityPrice: Number(form.communityPrice || 0),
          durationHours: Number(form.durationHours || 0),
          startDate: form.startDate,
          endDate: form.endDate,
          instructorUuid: selectedInstructor?.uuid ?? "",
          instructor: selectedInstructor?.displayName ?? "Ernesto Yattah",
          instructorSlug: selectedInstructor?.slug ?? "ernesto-yattah",
          maxStudents: Number(form.maxStudents || 0),
          status: form.status,
          stripePaymentLink: form.stripePaymentLink,
          thumbnailImageUrl: form.thumbnailImageUrl,
          coverImageUrl: form.coverImageUrl,
          summary: form.summary,
          description: form.description,
          includes: lines(form.includes),
          outcomes: lines(form.outcomes),
        }),
      },
    );

    setLoading(false);

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/courses");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The course could not be saved.");
      return;
    }

    router.push("/admin/courses");
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
            Slug is generated automatically from the title.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {course?.uuid ? (
            <Link
              href={`/admin/classes/${course.uuid}`}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
            >
              View classes
            </Link>
          ) : null}
          <Link
            href="/admin/courses"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
          >
            Back to list
          </Link>
        </div>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="grid gap-2 md:col-span-2">
          <TextField
            label="Title"
            value={form.title}
            onChange={(value) => setField("title", value)}
          />
          <p className="text-xs font-semibold text-[var(--muted)]">
            Generated slug: {generatedSlug || "course-title"}
          </p>
        </div>

        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <Label>Category</Label>
          <Select value={form.categoryUuid || ""} onValueChange={(value) => setField("categoryUuid", value)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((category) => category.enabled && Boolean(category.uuid))
                .map((category) => (
                  <SelectItem key={category.uuid} value={category.uuid ?? ""}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Link
            href="/admin/course-categories"
            className="text-xs font-bold text-[var(--sapphire)] underline underline-offset-4"
          >
            Manage categories
          </Link>
        </div>

        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <Label>Instructor</Label>
          <Select value={form.instructorUuid || ""} onValueChange={(value) => setField("instructorUuid", value === "__none__" ? "" : value)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Select an instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select an instructor</SelectItem>
              {instructors
                .filter((instructor) => instructor.enabled && Boolean(instructor.uuid))
                .map((instructor) => (
                  <SelectItem key={instructor.uuid} value={instructor.uuid ?? ""}>
                    {instructor.displayName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Link
            href="/admin/instructors"
            className="text-xs font-bold text-[var(--sapphire)] underline underline-offset-4"
          >
            Manage instructors
          </Link>
        </div>

        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <Label>Level</Label>
          <Select value={form.level} onValueChange={(value) => setField("level", value)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TextField
          label="Max students"
          type="number"
          value={form.maxStudents}
          onChange={(value) => setField("maxStudents", value)}
        />
        <TextField
          label="Price"
          type="number"
          value={form.price}
          onChange={(value) => setField("price", value)}
        />
        <TextField
          label="Community price"
          type="number"
          value={form.communityPrice}
          onChange={(value) => setField("communityPrice", value)}
        />
        <TextField
          label="Duration (hours)"
          type="number"
          value={form.durationHours}
          onChange={(value) => setField("durationHours", value)}
        />
        <DateField
          label="Start date"
          value={form.startDate}
          onChange={(value) => setField("startDate", value)}
        />
        <DateField
          label="End date"
          value={form.endDate}
          onChange={(value) => setField("endDate", value)}
        />
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
        <TextField
          label="Stripe link"
          value={form.stripePaymentLink}
          onChange={(value) => setField("stripePaymentLink", value)}
        />

        <ImageField
          kind="thumbnail"
          label="Thumbnail image"
          onUpload={uploadImage}
          uploading={uploading}
          url={form.thumbnailImageUrl}
        />
        <ImageField
          kind="cover"
          label="Cover image"
          onUpload={uploadImage}
          uploading={uploading}
          url={form.coverImageUrl}
        />

        <TextareaField
          label="Summary"
          value={form.summary}
          onChange={(value) => setField("summary", value)}
        />
        <TextareaField
          label="Description"
          value={form.description}
          onChange={(value) => setField("description", value)}
        />
        <TextareaField
          label="Includes"
          value={form.includes}
          onChange={(value) => setField("includes", value)}
        />
        <TextareaField
          label="Outcomes"
          value={form.outcomes}
          onChange={(value) => setField("outcomes", value)}
        />

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button type="submit" disabled={loading || Boolean(uploading)}>
            {loading ? "Saving..." : "Save course"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/courses">Cancel</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}


function ImageField({
  kind,
  label,
  onUpload,
  uploading,
  url,
}: {
  kind: "thumbnail" | "cover";
  label: string;
  onUpload: (
    event: ChangeEvent<HTMLInputElement>,
    kind: "thumbnail" | "cover",
  ) => void;
  uploading: "thumbnail" | "cover" | "";
  url: string;
}) {
  return (
    <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
      <Label>{label}</Label>
      <Input
        className="h-11"
        accept="image/png,image/jpeg,image/webp,image/gif"
        type="file"
        onChange={(event) => onUpload(event, kind)}
      />
      {uploading === kind ? (
        <span className="text-xs font-bold text-[var(--sapphire)]">
          Uploading...
        </span>
      ) : null}
      {url ? (
        <div className="relative h-28 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
          <Image alt="" className="object-cover" fill src={url} sizes="320px" />
        </div>
      ) : null}
    </div>
  );
}
