"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import type { TypePage } from "@/models/pages";

type PageFormState = {
	title: string;
	description: string;
	content: string;
	status: string;
};

function slugPreview(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function createFormState(page?: TypePage): PageFormState {
	return {
		title: page?.title ?? "",
		description: page?.description ?? "",
		content: page?.content ?? "",
		status: page?.status ?? "draft",
	};
}

export function PageForm({ page }: { page?: TypePage }) {
	const router = useRouter();
	const [form, setForm] = useState(() => createFormState(page));
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const isEditing = Boolean(page?.uuid);

	const generatedSlug = slugPreview(form.title);

	function setField(name: keyof PageFormState, value: string) {
		setForm((current) => ({ ...current, [name]: value }));
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");

		const response = await fetch(
			isEditing ? `/api/admin/pages/${page?.uuid}` : "/api/admin/pages",
			{
				method: isEditing ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: form.title,
					description: form.description,
					content: form.content,
					status: form.status,
				}),
			},
		);

		setLoading(false);

		if (response.status === 401) {
			window.location.assign("/operator-login?next=/admin/pages");
			return;
		}

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			setError(data.error ?? "The page could not be saved.");
			return;
		}

		router.push("/admin/pages");
		router.refresh();
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-display text-2xl font-semibold">
						{isEditing ? "Edit page" : "New page"}
					</h2>
					<p className="mt-1 text-sm text-[var(--muted)]">
						Slug is generated automatically from the title. Published pages are visible at /page/:slug.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link
						href="/admin/pages"
						className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
					>
						Back to list
					</Link>
				</div>
			</div>

			<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
				<div className="grid gap-2 md:col-span-2">
					<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
						<Label>Title</Label>
						<Input
							className="h-11"
							value={form.title}
							onChange={(event) => setField("title", event.target.value)}
						/>
					</div>
					<p className="text-xs font-semibold text-[var(--muted)]">
						Generated slug: {generatedSlug || "page-title"} → /page/{generatedSlug || "page-title"}
					</p>
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					<Label>Status</Label>
					<Select value={form.status} onValueChange={(value) => setField("status", value)}>
						<SelectTrigger className="h-11 w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="published">Published</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div />

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Description</Label>
					<Textarea
						className="min-h-24"
						placeholder="Short description shown in search results and link previews"
						value={form.description}
						onChange={(event) => setField("description", event.target.value)}
					/>
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Content (Markdown)</Label>
					<Textarea
						className="min-h-96 font-mono text-sm"
						placeholder="# Your markdown content here...&#10;&#10;Supports headings, lists, links, images, and more."
						value={form.content}
						onChange={(event) => setField("content", event.target.value)}
					/>
					<p className="text-xs text-[var(--muted)]">
						Write content using Markdown. Supports headings, bold, italic, links, images, lists, and code blocks.
					</p>
				</div>

				{error ? (
					<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
						{error}
					</p>
				) : null}

				<div className="flex flex-wrap gap-3 md:col-span-2">
					<Button type="submit" disabled={loading}>
						{loading ? "Saving..." : "Save page"}
					</Button>
					<Button asChild variant="outline">
						<Link href="/admin/pages">Cancel</Link>
					</Button>
				</div>
			</form>
		</section>
	);
}
