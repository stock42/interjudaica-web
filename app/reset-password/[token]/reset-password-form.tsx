"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "idle" | "sending" | "sent" | "error";

export default function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("sending");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setStatus("idle");
      return;
    }

    try {
      // TODO: wire token + endpoint when backend is ready.
      // Suggested endpoint: POST /api/user-auth/reset-password
      await new Promise((resolve) => setTimeout(resolve, 300));
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.06)] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--jade)]">
          Password updated
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold">
          You can sign in now
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Your password was updated. Return to the login page.
        </p>
        <Button className="mt-5" asChild>
          <a href="/login">Go to login</a>
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      {error ? (
        <p className="text-sm font-semibold text-[var(--sumac)]">{error}</p>
      ) : null}

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Saving…" : "Save password"}
      </Button>

      {status === "error" ? (
        <p className="text-sm font-semibold text-[var(--sumac)]">
          Unable to update password.
        </p>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        Note: reset password endpoint wiring is pending.
      </p>
    </form>
  );
}
