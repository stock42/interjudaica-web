"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import type { TypeContact } from "@/models/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatDate(value: string) {
	if (!value) {
		return "";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleString();
}

export function ContactReplyForm({ contact }: { contact: TypeContact }) {
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
		"idle",
	);
	const [subject, setSubject] = useState(
		contact.replySubject || `Re: InterJudaica contact request`,
	);
	const [message, setMessage] = useState(contact.replyMessage || "");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("sending");

		try {
			const response = await fetch(`/api/admin/contacts/${contact.uuid}/reply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, message }),
			});

			if (!response.ok) {
				throw new Error("Request failed");
			}

			setStatus("sent");
		} catch {
			setStatus("error");
		}
	}

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-5">
				<div className="flex flex-col gap-2">
					<p className="text-xs font-bold uppercase text-[var(--muted)]">
						Received
					</p>
					<p className="text-sm text-[var(--muted)]">
						{formatDate(contact.createdAt)}
					</p>
				</div>
				<div className="mt-4 grid gap-1">
					<p className="text-sm font-semibold text-[var(--ink)]">
						{contact.firstName} {contact.lastName}
					</p>
					<p className="text-sm text-[var(--muted)]">{contact.email}</p>
				</div>
				<div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)] whitespace-pre-wrap">
					{contact.message}
				</div>
				{contact.status === "replied" && contact.repliedAt ? (
					<p className="mt-3 text-xs text-[var(--muted)]">
						Replied {formatDate(contact.repliedAt)}
					</p>
				) : null}
			</section>

			<section className="rounded-lg border border-[var(--line)] bg-white p-5">
				<h2 className="font-display text-2xl font-semibold">Reply</h2>
				<form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
					<div className="grid gap-2">
						<Label htmlFor="subject">Subject</Label>
						<Input
							id="subject"
							value={subject}
							onChange={(event) => setSubject(event.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="message">Message</Label>
						<Textarea
							id="message"
							rows={8}
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							required
						/>
					</div>

					{status === "sent" ? (
						<p className="text-sm font-semibold text-[var(--jade)]">
							Reply sent.
						</p>
					) : null}
					{status === "error" ? (
						<p className="text-sm font-semibold text-[var(--sumac)]">
							Unable to send reply.
						</p>
					) : null}

					<div className="flex flex-wrap gap-3">
						<Button type="submit" disabled={status === "sending"}>
							{status === "sending" ? "Sending…" : "Send reply"}
						</Button>
						<Link
							href="/admin/contacts"
							className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold transition hover:bg-[var(--paper)]"
						>
							Back to list
						</Link>
					</div>
				</form>
			</section>
		</div>
	);
}
