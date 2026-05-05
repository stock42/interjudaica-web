"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import type { TypeInstructor } from "@/models/instructors";


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
        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <Label>Photo</Label>
          <Input
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="h-11"
            type="file"
            onChange={uploadPhoto}
          />
          {uploading ? (
            <span className="text-xs font-bold text-[var(--sapphire)]">
              Uploading...
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-4 self-end rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--ink)]">
          <span>Enabled</span>
          <Switch
            checked={form.enabled}
            onCheckedChange={(checked) => setField("enabled", Boolean(checked))}
          />
        </div>
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
          <Button type="submit" disabled={loading || uploading}>
            {loading ? "Saving..." : "Save instructor"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/instructors">Cancel</Link>
          </Button>
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
    <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
      <Label>{label}</Label>
      <Input
        className="h-11"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
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
    <div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
      <Label>{label}</Label>
      <Textarea
        className="min-h-28"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
