"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TypeRabbiBio } from "@/models/rabbi-bio";

export function RabbiBioForm({ bio }: { bio: TypeRabbiBio | null }) {
	const [title, setTitle] = useState(bio?.title ?? "Rabbi Ernesto Yattah");
	const [markdown, setMarkdown] = useState(bio?.markdown ?? "");
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
		"idle",
	);
	const [error, setError] = useState("");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("saving");
		setError("");

		try {
			const response = await fetch("/api/admin/rabbi-bio", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title, markdown }),
			});

			if (response.status === 401) {
				window.location.assign("/operator-login?next=/admin/rabbi-bio");
				return;
			}

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error ?? "Unable to save changes.");
			}

			setStatus("saved");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to save changes.");
			setStatus("error");
		}
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-5">
			<form className="grid gap-4" onSubmit={handleSubmit}>
				<div className="grid gap-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						required
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="markdown">Bio (Markdown)</Label>
					<Textarea
						id="markdown"
						value={markdown}
						onChange={(event) => setMarkdown(event.target.value)}
						rows={18}
						required
					/>
				</div>

				{status === "saved" ? (
					<p className="text-sm font-semibold text-[var(--jade)]">
						Saved.
					</p>
				) : null}
				{status === "error" ? (
					<p className="text-sm font-semibold text-[var(--sumac)]">{error}</p>
				) : null}

				<Button type="submit" disabled={status === "saving"}>
					{status === "saving" ? "Saving…" : "Save changes"}
				</Button>
			</form>
		</section>
	);
}
