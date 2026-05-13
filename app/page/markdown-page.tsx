"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TypePage } from "@/models/pages";

export function MarkdownPage({ page }: { page: TypePage }) {
	return (
		<main className="min-h-screen bg-[var(--paper)]">
			<article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
				<h1 className="font-display text-3xl font-bold text-[var(--ink)]">
					{page.title}
				</h1>
				{page.description ? (
					<p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
						{page.description}
					</p>
				) : null}
				<div className="prose prose-lg mt-8 max-w-none text-[var(--ink)]">
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{page.content}
					</ReactMarkdown>
				</div>
			</article>
		</main>
	);
}
