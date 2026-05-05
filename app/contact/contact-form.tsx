"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      email: String(formData.get("email") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

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
          Message sent
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold">
          Thank you for reaching out.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          We received your message and will reply as soon as possible.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} aria-busy={status === "sending"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div className="hidden sm:block" />

        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required className="min-h-40" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send"}
        </Button>
        {status === "error" ? (
          <span className="text-sm font-semibold text-[var(--sumac)]">
            Unable to send. Please try again.
          </span>
        ) : null}
      </div>
    </form>
  );
}
