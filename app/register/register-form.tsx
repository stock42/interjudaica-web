"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const email = String(formData.get("email") ?? "");
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
        email,
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

    window.location.assign(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="First name" name="firstName" autoComplete="given-name" />
        <FormField label="Last name" name="lastName" autoComplete="family-name" />
      </div>

      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField label="Country" name="country" autoComplete="country-name" />
        <FormField label="State" name="state" autoComplete="address-level1" />
        <FormField label="City" name="city" autoComplete="address-level2" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
        <FormField
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

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create account"}
      </Button>

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

function FormField({
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
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        autoComplete={autoComplete}
        minLength={minLength}
        placeholder={placeholder}
        required
        type={type}
      />
    </div>
  );
}
