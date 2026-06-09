"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Components } from "react-markdown";

const sanitizeSchema = {
	...defaultSchema,
	tagNames: [
		...(defaultSchema.tagNames ?? []),
		"img",
		"figure",
		"figcaption",
		"video",
		"source",
		"iframe",
	],
	attributes: {
		...defaultSchema.attributes,
		img: ["src", "alt", "title", "width", "height", "loading", "style"],
		iframe: ["src", "title", "width", "height", "allow", "allowFullscreen"],
		video: ["src", "controls", "width", "height", "poster"],
		source: ["src", "type"],
		a: [
			"href",
			"target",
			"rel",
			"title",
			...((defaultSchema.attributes as Record<string, string[]>)?.["a"] ?? []),
		],
	},
};

const defaultComponents: Components = {
	a: ({ href, children, ...props }) => (
		<a
			href={href}
			target={href?.startsWith("http") ? "_blank" : undefined}
			rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
			{...props}
		>
			{children}
		</a>
	),
};

export function MarkdownRenderer({
	content,
	className,
	components,
}: {
	content: string;
	className?: string;
	components?: Components;
}) {
	return (
		<div className={className}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
				components={{ ...defaultComponents, ...components }}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
