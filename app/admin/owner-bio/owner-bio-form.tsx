"use client";

import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TypeOwnerBio } from "@/models/owner-bio";
import AiCreateModal from "@/app/admin/components/ai-create-modal";

export function OwnerBioForm({ bio }: { bio: TypeOwnerBio | null }) {
	const [title, setTitle] = useState(bio?.title ?? "Ernesto Yattah");
	const [markdown, setMarkdown] = useState(bio?.markdown ?? "");
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
		"idle",
	);
	const [error, setError] = useState("");
	const [aiModalOpen, setAiModalOpen] = useState(false);

	const systemPrompt = `You are helping update the public bio page for Ernesto Yattah, founder of InterJudaica — an online platform for English-language Jewish courses, community membership, papers, and forums targeting the United States market.

The bio should be professional, warm, and engaging. It should include:
- Ernesto's background and expertise in Jewish studies
- His vision for InterJudaica
- What students and community members can expect

The bio is written in markdown. Respond with a JSON object containing:
- "title": the display title (typically "Ernesto Yattah")
- "markdown": the full bio content in markdown format

Keep the tone authentic, scholarly but accessible. Target length: 3-6 paragraphs.`;

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

	async function handleAiCreate(data: Record<string, unknown>) {
		const title = String(data.title ?? "");
		const markdown = String(data.markdown ?? "");

		if (!title || !markdown) {
			throw new Error("AI did not generate valid title and markdown fields.");
		}

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
			const body = await response.json().catch(() => ({}));
			throw new Error(body.error ?? "Failed to update owner bio via AI.");
		}

		setTitle(title);
		setMarkdown(markdown);
		setStatus("saved");
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

				<div className="lg:col-span-2 flex items-center gap-3">
					<Button type="submit" disabled={status === "saving"}>
						{status === "saving" ? "Saving…" : "Save changes"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => setAiModalOpen(true)}
					>
						<Sparkles className="size-4" data-icon="inline-start" />
						Generate with AI
					</Button>
				</div>
			</form>

			<AiCreateModal
				entityType="owner_bio"
				entityName="Owner Bio"
				onCreate={handleAiCreate}
				systemPrompt={systemPrompt}
				open={aiModalOpen}
				onOpenChange={setAiModalOpen}
				trigger={<span />}
			/>
		</section>
	);
}
