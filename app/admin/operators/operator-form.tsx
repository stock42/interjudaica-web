"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TypeSafeOperator } from "@/models/operators";

const controlClass =
  "min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

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
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Level
          <select
            className={controlClass}
            value={form.level}
            onChange={(event) => setField("level", event.target.value)}
          >
            <option value="50">50 - Administrator</option>
            <option value="30">30 - Manager</option>
            <option value="10">10 - Support</option>
          </select>
        </label>
        <TextField
          label={isEditing ? "New password" : "Password"}
          type="password"
          value={form.password}
          required={!isEditing}
          onChange={(value) => setField("password", value)}
        />
        <label className="flex items-center gap-3 self-end rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-semibold text-[var(--ink)]">
          <input
            className="h-5 w-5 accent-[var(--sapphire)]"
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setField("enabled", event.target.checked)}
          />
          Enabled
        </label>

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
            {loading ? "Saving..." : "Save operator"}
          </button>
          <Link
            href="/admin/operators"
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
    <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
      {label}
      <input
        className={controlClass}
        minLength={type === "password" ? 8 : undefined}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
