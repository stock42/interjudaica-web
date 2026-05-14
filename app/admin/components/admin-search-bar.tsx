"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type SearchResult = {
	title: string;
	subtitle: string;
	entity: string;
	href: string;
};

export function AdminSearchBar() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	function handleChange(value: string) {
		setQuery(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);

		if (value.trim().length < 2) {
			setResults([]);
			setOpen(false);
			return;
		}

		debounceRef.current = setTimeout(async () => {
			setLoading(true);
			const res = await fetch(`/api/admin/search?q=${encodeURIComponent(value.trim())}`);
			const data = await res.json();
			setResults(data.items ?? []);
			setOpen(true);
			setLoading(false);
		}, 300);
	}

	return (
		<div ref={containerRef} className="relative w-full max-w-md">
			<Input
				className="h-10 w-full"
				type="search"
				placeholder="Search courses, books, users, pages, papers..."
				value={query}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={() => results.length > 0 && setOpen(true)}
			/>
			{open ? (
				<div className="absolute top-full z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-[var(--line)] bg-white shadow-xl">
					{loading ? (
						<div className="px-4 py-3 text-sm text-[var(--muted)]">Searching...</div>
					) : results.length === 0 ? (
						<div className="px-4 py-3 text-sm text-[var(--muted)]">No results</div>
					) : (
						results.map((r, i) => (
							<Link
								key={i}
								href={r.href}
								onClick={() => setOpen(false)}
								className="flex items-center justify-between px-4 py-2.5 text-sm transition hover:bg-[var(--paper)]"
							>
								<div>
									<p className="font-semibold text-[var(--ink)]">{r.title}</p>
									<p className="text-xs text-[var(--muted)]">{r.subtitle}</p>
								</div>
								<span className="shrink-0 rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--muted)]">
									{r.entity}
								</span>
							</Link>
						))
					)}
				</div>
			) : null}
		</div>
	);
}
