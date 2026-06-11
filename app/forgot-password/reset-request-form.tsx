"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { csrfFetch } from "@/lib/csrf-client";

type Status = "idle" | "sending" | "sent" | "error";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      email: String(formData.get("email") ?? ""),
    };

    try {
      const response = await csrfFetch("/api/user-auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      form.reset();
      setStatus("sent");
      window.location.assign(
        `/reset-password?email=${encodeURIComponent(payload.email)}&sent=1`,
      );
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.06)] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--jade)]">
          Email sent
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold">
          Check your inbox
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          If an account exists for that email, you will receive a 6-digit code
          shortly.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send code"}
      </Button>

      {status === "error" ? (
        <p className="text-sm font-semibold text-[var(--sumac)]">
          Unable to send reset email.
        </p>
      ) : null}    </form>
  );
}
