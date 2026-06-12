"use client";

import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TypeOwnerBio } from "@/models/owner-bio";

export function OwnerBioForm({ bio }: { bio: TypeOwnerBio | null }) {
	const [title, setTitle] = useState(bio?.title ?? "Ernesto Yattah");
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
			const response = await fetch("/api/admin/owner-bio", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title, markdown }),
			});

			if (response.status === 401) {
				window.location.assign("/operator-login?next=/admin/owner-bio");
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
			<form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
				<div className="grid gap-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						required
					/>
				</div>

				<div className="grid gap-2 lg:col-span-2">
					<Label htmlFor="markdown">Bio (Markdown)</Label>
					<Textarea
						id="markdown"
						value={markdown}
						onChange={(event) => setMarkdown(event.target.value)}
						rows={18}
						required
					/>
				</div>

				<div className="lg:col-span-2">
					<p className="text-xs font-semibold text-[var(--muted)]">Preview</p>
					<div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
						{markdown ? (
							<div className="prose max-w-none text-[var(--ink)]">
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeSanitize]}
								>
									{markdown}
								</ReactMarkdown>
							</div>
						) : (
							<p className="text-sm text-[var(--muted)]">
								Start typing markdown to see the preview.
							</p>
						)}
					</div>
				</div>

				{status === "saved" ? (
					<p className="text-sm font-semibold text-[var(--jade)] lg:col-span-2">
						Saved.
					</p>
				) : null}
				{status === "error" ? (
					<p className="text-sm font-semibold text-[var(--sumac)] lg:col-span-2">
						{error}
					</p>
				) : null}

				<div className="lg:col-span-2">
					<Button type="submit" disabled={status === "saving"}>
						{status === "saving" ? "Saving…" : "Save changes"}
					</Button>
				</div>
			</form>
		</section>
	);
}
