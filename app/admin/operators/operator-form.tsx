"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import type { TypeSafeOperator } from "@/models/operators";


type OperatorFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  level: string;
  enabled: boolean;
};

function createFormState(operator?: TypeSafeOperator): OperatorFormState {
  return {
    firstName: operator?.firstName ?? "",
    lastName: operator?.lastName ?? "",
    email: operator?.email ?? "",
    password: "",
    level: String(operator?.level ?? 50),
    enabled: operator?.enabled ?? true,
  };
}

export function OperatorForm({
  operator,
}: {
  operator?: TypeSafeOperator;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => createFormState(operator));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(operator?.uuid);

  function setField<K extends keyof OperatorFormState>(
    name: K,
    value: OperatorFormState[K],
  ) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      level: Number(form.level),
      enabled: form.enabled,
    };

    const response = await fetch(
      isEditing
        ? `/api/admin/operators/${operator?.uuid}`
        : "/api/admin/operators",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setLoading(false);

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/operators");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The operator could not be saved.");
      return;
    }

    router.push("/admin/operators");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {isEditing ? "Edit operator" : "New operator"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Operator accounts can access the backoffice and admin APIs.
          </p>
        </div>
        <Link
          href="/admin/operators"
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
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setField("email", value)}
        />
        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <Label>Level</Label>
          <Select value={form.level} onValueChange={(value) => setField("level", value)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 - Administrator</SelectItem>
              <SelectItem value="30">30 - Manager</SelectItem>
              <SelectItem value="10">10 - Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TextField
          label={isEditing ? "New password" : "Password"}
          type="password"
          value={form.password}
          required={!isEditing}
          onChange={(value) => setField("password", value)}
        />
        <div className="flex items-center justify-between gap-4 self-end rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--ink)]">
          <span>Enabled</span>
          <Switch
            checked={form.enabled}
            onCheckedChange={(checked) => setField("enabled", Boolean(checked))}
          />
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save operator"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/operators">Cancel</Link>
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
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "email" | "password" | "text";
}) {
  return (
    <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
      <Label>{label}</Label>
      <Input
        className="h-11"
        minLength={type === "password" ? 8 : undefined}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
