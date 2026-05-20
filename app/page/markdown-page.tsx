"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Components } from "react-markdown";
import type { TypePage } from "@/models/pages";

const schema = {
	...defaultSchema,
	tagNames: [...(defaultSchema.tagNames ?? []), "img"],
	attributes: {
		...defaultSchema.attributes,
		img: ["src", "alt", "title", "width", "height", "loading"],
	},
};

const components: Components = {
	h1: ({ children }) => (
		<h1 className="mt-10 mb-5 font-display text-3xl font-bold text-[var(--gold)] first:mt-0">
			{children}
		</h1>
	),
	h2: ({ children }) => (
		<h2 className="mt-9 mb-4 font-display text-2xl font-bold text-[var(--gold)]">
			{children}
		</h2>
	),
	h3: ({ children }) => (
		<h3 className="mt-8 mb-3 font-display text-xl font-bold text-[var(--gold)]">
			{children}
		</h3>
	),
	p: ({ children }) => (
		<p className="my-4 text-base leading-7 text-[var(--muted)] first:mt-0">
			{children}
		</p>
	),
	strong: ({ children }) => (
		<strong className="font-bold text-[var(--ink)]">{children}</strong>
	),
	em: ({ children }) => (
		<em className="italic text-[var(--ink)]">{children}</em>
	),
	ul: ({ children }) => (
		<ul className="my-4 ml-6 list-disc space-y-2 text-base leading-7 text-[var(--muted)]">
			{children}
		</ul>
	),
	ol: ({ children }) => (
		<ol className="my-4 ml-6 list-decimal space-y-2 text-base leading-7 text-[var(--muted)]">
			{children}
		</ol>
	),
	li: ({ children }) => <li className="pl-1">{children}</li>,
	blockquote: ({ children }) => (
		<blockquote className="my-5 border-l-4 border-[var(--gold)] bg-[rgba(244,189,51,0.06)] py-4 pl-5 pr-4 text-base italic leading-7 text-[var(--muted)]">
			{children}
		</blockquote>
	),
	a: ({ href, children }) => (
		<a
			href={href}
			className="font-semibold text-[var(--gold)] underline decoration-[var(--gold)]/40 underline-offset-2 transition hover:decoration-[var(--gold)]"
			target={href?.startsWith("http") ? "_blank" : undefined}
			rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
		>
			{children}
		</a>
	),
	img: ({ src, alt }) => (
		typeof src === "string" && src ? (
			<div className="relative my-6 aspect-[16/9] w-full overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-soft)]">
				<Image
					src={src}
					alt={alt ?? ""}
					fill
					unoptimized
					sizes="(min-width: 1024px) 768px, 100vw"
					className="object-contain"
				/>
			</div>
		) : null
	),
	hr: () => (
		<hr className="my-8 border-t border-[var(--line)]" />
	),
	code: ({ children, className }) => {
		const isInline = !className;
		if (isInline) {
			return (
				<code className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-sm font-mono text-[var(--sapphire)]">
					{children}
				</code>
			);
		}
		return (
			<code className="block overflow-x-auto rounded-lg bg-[var(--surface-soft)] p-4 text-sm font-mono leading-relaxed text-[var(--ink)]">
				{children}
			</code>
		);
	},
	pre: ({ children }) => (
		<pre className="my-5 overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-0">
			{children}
		</pre>
	),
	table: ({ children }) => (
		<div className="my-5 overflow-x-auto rounded-lg border border-[var(--line)]">
			<table className="w-full border-collapse text-left text-sm">
				{children}
			</table>
		</div>
	),
	thead: ({ children }) => (
		<thead className="bg-[rgba(244,189,51,0.08)] text-xs uppercase tracking-[0.1em] text-[var(--gold)]">
			{children}
		</thead>
	),
	th: ({ children }) => (
		<th className="px-4 py-3 font-bold">{children}</th>
	),
	td: ({ children }) => (
		<td className="border-t border-[var(--line)] px-4 py-3 text-[var(--muted)]">
			{children}
		</td>
	),
};

export function MarkdownPage({ page }: { page: TypePage }) {
	return (
		<main className="min-h-screen bg-[var(--paper)]">
			<article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
				<h1 className="font-display text-4xl font-bold leading-tight text-[var(--gold)] sm:text-5xl">
					{page.title}
				</h1>
				{page.description ? (
					<p className="mt-5 text-lg leading-8 text-[var(--muted)]">
						{page.description}
					</p>
				) : null}
				<div className="mt-10">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						rehypePlugins={[[rehypeSanitize, schema]]}
						components={components}
					>
						{page.content}
					</ReactMarkdown>
				</div>
			</article>
		</main>
	);
}
