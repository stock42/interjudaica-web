"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function MarkdownEditor({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	const [tab, setTab] = useState<"edit" | "preview">("edit");

	return (
		<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
			<div className="flex items-center justify-between">
				<Label>{label}</Label>
				<div className="flex gap-1 rounded-md border border-[var(--line)] bg-[var(--paper)] p-0.5">
					<button
						type="button"
						onClick={() => setTab("edit")}
						className={`rounded px-3 py-1 text-xs font-semibold transition ${tab === "edit" ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"}`}
					>
						Edit
					</button>
					<button
						type="button"
						onClick={() => setTab("preview")}
						className={`rounded px-3 py-1 text-xs font-semibold transition ${tab === "preview" ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"}`}
					>
						Preview
					</button>
				</div>
			</div>
			{tab === "edit" ? (
				<Textarea
					className="min-h-96 font-mono text-sm"
					placeholder="# Your markdown content here..."
					value={value}
					onChange={(event) => onChange(event.target.value)}
				/>
			) : (
				<div className="prose prose-sm max-w-none rounded-md border border-[var(--line)] bg-white p-4 min-h-96">
					{value ? (
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
					) : (
						<p className="text-[var(--muted)]">Nothing to preview.</p>
					)}
				</div>
			)}
		</div>
	);
}
