"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TypeInstructor } from "@/models/instructors";

const controlClass =
  "min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

const textareaClass =
  "min-h-28 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

type InstructorFormState = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  bio: string;
  photoUrl: string;
  enabled: boolean;
};

function createFormState(instructor?: TypeInstructor): InstructorFormState {
  return {
    firstName: instructor?.firstName ?? "",
    lastName: instructor?.lastName ?? "",
    displayName: instructor?.displayName ?? "",
    email: instructor?.email ?? "",
    bio: instructor?.bio ?? "",
    photoUrl: instructor?.photoUrl ?? "",
    enabled: instructor?.enabled ?? true,
  };
}

export function InstructorForm({ instructor }: { instructor?: TypeInstructor }) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(instructor));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(instructor?.uuid);

  function setField<K extends keyof InstructorFormState>(
    name: K,
    value: InstructorFormState[K],
  ) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setUploading(true);
    setError("");

    const response = await fetch("/api/admin/uploads/instructor-photo", {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    event.target.value = "";

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/instructors");
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error ?? "The photo could not be uploaded.");
      return;
    }

    setField("photoUrl", data.url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(
      isEditing
        ? `/api/admin/instructors/${instructor?.uuid}`
        : "/api/admin/instructors",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );

    setLoading(false);

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/instructors");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The instructor could not be saved.");
      return;
    }

    router.push("/admin/instructors");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {isEditing ? "Edit instructor" : "New instructor"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Upload the public instructor photo and profile details.
          </p>
        </div>
        <Link
          href="/admin/instructors"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
        >
          Back to list
        </Link>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <TextField
          label="First name"
          value={form.firstName}
          onChange={(value) => setField("firstName", value)}
        />
        <TextField
          label="Last name"
          value={form.lastName}
          onChange={(value) => setField("lastName", value)}
        />
        <TextField
          label="Display name"
          value={form.displayName}
          onChange={(value) => setField("displayName", value)}
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setField("email", value)}
        />
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Photo
          <input
            accept="image/png,image/jpeg,image/webp,image/gif"
            className={controlClass}
            type="file"
            onChange={uploadPhoto}
          />
          {uploading ? (
            <span className="text-xs font-bold text-[var(--sapphire)]">
              Uploading...
            </span>
          ) : null}
        </label>
        <label className="flex items-center gap-3 self-end rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--ink)]">
          <input
            className="h-5 w-5 accent-[var(--sapphire)]"
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setField("enabled", event.target.checked)}
          />
          Enabled
        </label>
        {form.photoUrl ? (
          <div className="md:col-span-2">
            <div className="relative h-36 w-36 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)]">
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="144px"
                src={form.photoUrl}
              />
            </div>
          </div>
        ) : null}
        <TextareaField
          label="Bio"
          value={form.bio}
          onChange={(value) => setField("bio", value)}
        />

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#07090c] transition hover:bg-[#ffd66b] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading || uploading}
          >
            {loading ? "Saving..." : "Save instructor"}
          </button>
          <Link
            href="/admin/instructors"
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
  type?: "email" | "text";
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

