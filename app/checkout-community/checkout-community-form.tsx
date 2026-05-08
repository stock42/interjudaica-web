"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

export function CheckoutCommunityForm() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/community/checkout", {
				method: "POST",
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok || !data.url) {
				throw new Error(data.error ?? "Unable to start checkout.");
			}

			window.location.assign(data.url);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to start checkout.");
			setLoading(false);
		}
	}

	return (
		<form className="grid gap-4" onSubmit={handleSubmit}>
			<div className="rounded-lg border border-[var(--line)] bg-white p-4">
				<p className="text-xs font-bold uppercase text-[var(--muted)]">
					Community membership
				</p>
				<p className="mt-3 text-2xl font-semibold">$19 USD / month</p>
				<p className="mt-2 text-sm text-[var(--muted)]">
					Private forum, Rabbi papers, and member-only discounts.
				</p>
			</div>

			{error ? (
				<p className="text-sm font-semibold text-[var(--sumac)]">{error}</p>
			) : null}

			<Button type="submit" disabled={loading}>
				{loading ? "Redirecting…" : "Continue to payment"}
			</Button>
		</form>
	);
}
