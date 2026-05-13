"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { TypePage } from "@/models/pages";

export function MoreContentMenu({ pages }: { pages: TypePage[] }) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (pages.length === 0) return null;

	return (
		<div ref={containerRef} className="relative shrink-0">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={`shrink-0 border-b-2 px-1 py-2 text-base font-medium transition ${open ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[rgba(248,242,232,0.9)] hover:border-[var(--gold)] hover:text-[var(--gold)]"}`}
				aria-expanded={open}
				aria-haspopup="true"
			>
				More content
				<svg
					className={`ml-1 inline-block h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			{open ? (
				<div className="absolute left-0 top-full z-50 mt-2 min-w-56 rounded-lg border border-[var(--line)] bg-[#0b0f12] py-2 shadow-xl">
					{pages.map((page) => (
						<Link
							key={page.uuid}
							href={`/page/${page.slug}`}
							className="block px-4 py-2 text-sm font-medium text-[rgba(248,242,232,0.9)] transition hover:bg-white/5 hover:text-[var(--gold)]"
							onClick={() => setOpen(false)}
						>
							{page.title}
						</Link>
					))}
				</div>
			) : null}
		</div>
	);
}
