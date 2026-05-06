"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TypeSocialProof } from "@/models/social-proof";



type SocialProofFormState = {
  quote: string;
  name: string;
  detail: string;
  status: string;
  order: string;
};

function createFormState(item?: TypeSocialProof): SocialProofFormState {
  return {
    quote: item?.quote ?? "",
    name: item?.name ?? "",
    detail: item?.detail ?? "",
    status: item?.status ?? "draft",
    order: String(item?.order ?? 0),
  };
}

export function SocialProofForm({ item }: { item?: TypeSocialProof }) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(item));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(item?.uuid);

  function setField(name: keyof SocialProofFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(
      isEditing
        ? `/api/admin/social-proof/${item?.uuid}`
        : "/api/admin/social-proof",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote: form.quote,
          name: form.name,
          detail: form.detail,
          status: form.status,
          order: Number(form.order || 0),
        }),
      },
    );

    setLoading(false);

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/social-proof");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The testimonial could not be saved.");
      return;
    }

    router.push("/admin/social-proof");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {isEditing ? "Edit testimonial" : "New testimonial"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Testimonials appear on the homepage when published.
          </p>
        </div>
        <Link
          href="/admin/social-proof"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
        >
          Back to list
        </Link>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
          Quote
          <Textarea
            value={form.quote}
            onChange={(event) => setField("quote", event.target.value)}
            rows={4}
            placeholder="Share the student feedback or highlight."
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Name
          <Input
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="Student name"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Detail
          <Input
            value={form.detail}
            onChange={(event) => setField("detail", event.target.value)}
            placeholder="Location or cohort"
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
            </SelectContent>
          </Select>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Display order
          <Input
            type="number"
            min={0}
            value={form.order}
            onChange={(event) => setField("order", event.target.value)}
          />
        </label>
        {error ? (
          <p className="text-sm font-semibold text-red-600 md:col-span-2">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Saving" : "Save testimonial"}
          </Button>
          <Link
            href="/admin/social-proof"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold transition hover:bg-[var(--paper)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
