"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		function handleScroll() {
			setVisible(window.scrollY > 400);
		}
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	if (!visible) return null;

	return (
		<button
			type="button"
			onClick={scrollToTop}
			aria-label="Back to top"
			className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gold)] bg-[#050608] text-[var(--gold)] shadow-lg transition hover:bg-[var(--gold)] hover:text-[#050608]"
		>
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
			</svg>
		</button>
	);
}
