"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import type { TypeBook } from "@/models/books";

type BookFormState = {
	title: string;
	description: string;
	longDescription: string;
	coverUrl: string;
	filePath: string;
	price: string;
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

function createFormState(book?: TypeBook): BookFormState {
	return {
		title: book?.title ?? "",
		description: book?.description ?? "",
		longDescription: book?.longDescription ?? "",
		coverUrl: book?.coverUrl ?? "",
		filePath: book?.filePath ?? "",
		price: String(book?.price ?? 0),
		status: book?.status ?? "draft",
	};
}

export function BookForm({ book }: { book?: TypeBook }) {
	const router = useRouter();
	const [form, setForm] = useState(() => createFormState(book));
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState<"cover" | "file" | "">("");
	const [error, setError] = useState("");
	const isEditing = Boolean(book?.uuid);

	const generatedSlug = slugPreview(form.title);

	function setField(name: keyof BookFormState, value: string) {
		setForm((current) => ({ ...current, [name]: value }));
	}

	async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploading("cover");
		setError("");

		const formData = new FormData();
		formData.set("file", file);

		const response = await fetch("/api/admin/uploads/book-cover", {
			method: "POST",
			body: formData,
		});

		setUploading("");
		event.target.value = "";

		if (response.status === 401) {
			window.location.assign("/operator-login?next=/admin/books");
			return;
		}

		const data = await response.json().catch(() => ({}));
		if (!response.ok) {
			setError(data.error ?? "The image could not be uploaded.");
			return;
		}

		setField("coverUrl", data.url);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");

		const response = await fetch(
			isEditing ? `/api/admin/books/${book?.uuid}` : "/api/admin/books",
			{
				method: isEditing ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: form.title,
					description: form.description,
					longDescription: form.longDescription,
					coverUrl: form.coverUrl,
					filePath: form.filePath,
					price: Number(form.price || 0),
					status: form.status,
				}),
			},
		);

		setLoading(false);

		if (response.status === 401) {
			window.location.assign("/operator-login?next=/admin/books");
			return;
		}

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			setError(data.error ?? "The book could not be saved.");
			return;
		}

		router.push("/admin/books");
		router.refresh();
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-display text-2xl font-semibold">
						{isEditing ? "Edit book" : "New book"}
					</h2>
					<p className="mt-1 text-sm text-[var(--muted)]">
						Slug is generated automatically from the title.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link
						href="/admin/books"
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
						Generated slug: {generatedSlug || "book-title"}
					</p>
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					<Label>Price (USD)</Label>
					<Input
						className="h-11"
						min={0}
						step="any"
						type="number"
						value={form.price}
						onChange={(event) => setField("price", event.target.value)}
					/>
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

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					<Label>Cover image</Label>
					<Input
						className="h-11"
						accept="image/png,image/jpeg,image/webp,image/gif"
						type="file"
						onChange={uploadImage}
					/>
					{uploading === "cover" ? (
						<span className="text-xs font-bold text-[var(--sapphire)]">
							Uploading...
						</span>
					) : null}
					{form.coverUrl ? (
						<div className="relative h-40 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
							<Image alt="" className="object-cover" fill src={form.coverUrl} sizes="320px" />
						</div>
					) : null}
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					<Label>PDF file path</Label>
					<Input
						className="h-11"
						placeholder="/uploads/books/example.pdf"
						value={form.filePath}
						onChange={(event) => setField("filePath", event.target.value)}
					/>
					<p className="text-xs text-[var(--muted)]">
						Upload the PDF to public/uploads/books and enter the relative path.
					</p>
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Short description</Label>
					<Textarea
						className="min-h-24"
						value={form.description}
						onChange={(event) => setField("description", event.target.value)}
					/>
				</div>

				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Long description</Label>
					<Textarea
						className="min-h-36"
						value={form.longDescription}
						onChange={(event) => setField("longDescription", event.target.value)}
					/>
				</div>

				{error ? (
					<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
						{error}
					</p>
				) : null}

				<div className="flex flex-wrap gap-3 md:col-span-2">
					<Button type="submit" disabled={loading || Boolean(uploading)}>
						{loading ? "Saving..." : "Save book"}
					</Button>
					<Button asChild variant="outline">
						<Link href="/admin/books">Cancel</Link>
					</Button>
				</div>
			</form>
		</section>
	);
}
