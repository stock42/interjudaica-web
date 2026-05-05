"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const controlClass =
  "min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4 text-base font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/user-auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        country: formData.get("country"),
        state: formData.get("state"),
        city: formData.get("city"),
        password,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The account could not be created.");
      return;
    }

    window.location.assign("/dashboard");
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" autoComplete="given-name" />
        <Field label="Last name" name="lastName" autoComplete="family-name" />
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Country" name="country" autoComplete="country-name" />
        <Field label="State" name="state" autoComplete="address-level1" />
        <Field label="City" name="city" autoComplete="address-level2" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
      </div>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#07090c] transition hover:bg-[#ffd66b] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create account"}
      </button>
      <p className="text-sm leading-6 text-[var(--muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--sapphire)] underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  autoComplete,
  minLength,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
      {label}
      <input
        autoComplete={autoComplete}
        className={controlClass}
        minLength={minLength}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}
