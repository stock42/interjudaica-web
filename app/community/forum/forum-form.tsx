"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { csrfFetch } from "@/lib/csrf-client";

export function CommunityThreadForm() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [imageUrl, setImageUrl] = useState("");

	async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		const formData = new FormData();
		formData.set("file", file);

		const response = await fetch("/api/forums/upload-image", {
			method: "POST",
			body: formData,
		});

		const data = await response.json().catch(() => ({}));
		if (!response.ok) {
			setError(data.error ?? "Unable to upload image.");
			return;
		}

		setImageUrl(data.url ?? "");
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");

		const form = event.currentTarget;
		const formData = new FormData(form);
		const title = String(formData.get("title") ?? "");
		const content = String(formData.get("content") ?? "");

		const response = await csrfFetch("/api/forums", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				scope: "community",
				title,
				content,
				imageUrls: imageUrl ? [imageUrl] : [],
			}),
		});

		setLoading(false);

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			setError(data.error ?? "Unable to create thread.");
			return;
		}

		window.location.reload();
	}

	return (
		<form className="rounded-lg border border-[var(--line)] bg-white p-5" onSubmit={handleSubmit}>
			<h2 className="text-lg font-semibold text-[var(--ink)]">Start a thread</h2>
			<div className="mt-4 grid gap-3">
				<label className="grid gap-2 text-sm font-semibold">
					Title
					<Input name="title" required />
				</label>
				<label className="grid gap-2 text-sm font-semibold">
					Message
					<Textarea name="content" rows={4} required />
				</label>
				<label className="grid gap-2 text-sm font-semibold">
					Image (optional)
					<Input type="file" accept="image/*" onChange={uploadImage} />
					{imageUrl ? (
						<p className="text-xs text-[var(--muted)]">Image uploaded.</p>
					) : null}
				</label>
				{error ? (
					<p className="text-sm font-semibold text-[var(--sumac)]">{error}</p>
				) : null}
				<Button type="submit" disabled={loading}>
					{loading ? "Posting..." : "Post thread"}
				</Button>
			</div>
		</form>
	);
}
