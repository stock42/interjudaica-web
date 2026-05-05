"use client";

import { useMemo, useState, type FormEvent } from "react";

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const safeNextPath = useMemo(
    () => (nextPath.startsWith("/") ? nextPath : "/dashboard"),
    [nextPath],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/user-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("Email or password is incorrect.");
      return;
    }

    window.location.assign(safeNextPath);
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        Email
        <input
          className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4 text-base font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        Password
        <input
          className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4 text-base font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
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
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
