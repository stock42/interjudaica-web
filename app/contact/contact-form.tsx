"use client";

import { useState } from "react";

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
        <button
          type="button"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--paper)]"
          onClick={() => setStatus("idle")}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input
            className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </label>

        <div className="hidden sm:block" />

        <label className="grid gap-2 text-sm font-semibold">
          First name
          <input
            className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4"
            name="firstName"
            required
            autoComplete="given-name"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Last name
          <input
            className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4"
            name="lastName"
            required
            autoComplete="family-name"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Message
        <textarea
          className="min-h-40 rounded-md border border-[var(--line)] bg-[var(--paper)] p-4"
          name="message"
          required
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#07090c] transition hover:bg-[#ffd66b] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
        {status === "error" ? (
          <span className="text-sm font-semibold text-[var(--sumac)]">
            Unable to send. Please try again.
          </span>
        ) : null}
      </div>
    </form>
  );
}
