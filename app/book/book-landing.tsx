"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { TypeBook } from "@/models/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatUsd = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

export function BookLanding({ book }: { book: TypeBook }) {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleBuy(event: FormEvent) {
		event.preventDefault();
		setLoading(true);
		setError("");

		const response = await fetch("/api/books/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				bookUuid: book.uuid,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
			}),
		});

		const data = await response.json().catch(() => ({}));
		setLoading(false);

		if (!response.ok) {
			setError(data.error ?? "Something went wrong. Please try again.");
			return;
		}

		if (data.url) {
			window.location.assign(data.url);
		}
	}

	return (
		<main className="min-h-screen bg-[var(--paper)]">
			<div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid gap-8 lg:grid-cols-2">
					<div>
						{book.coverUrl ? (
							<div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-[var(--line)] bg-white">
								<Image
									alt={book.title}
									className="object-cover"
									fill
									src={book.coverUrl}
									sizes="(max-width: 768px) 100vw, 50vw"
									priority
								/>
							</div>
						) : (
							<div className="flex aspect-[3/4] items-center justify-center rounded-lg border border-[var(--line)] bg-white">
								<span className="text-sm font-semibold text-[var(--muted)]">
									No cover
								</span>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-6">
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-[var(--sapphire)]">
								Book
							</p>
							<h1 className="mt-2 font-display text-3xl font-bold text-[var(--ink)]">
								{book.title}
							</h1>
							<p className="mt-4 text-2xl font-bold text-[var(--ink)]">
								{book.price > 0 ? formatUsd.format(book.price) : "Free"}
							</p>
						</div>

						{book.description ? (
							<p className="text-sm leading-relaxed text-[var(--muted)]">
								{book.description}
							</p>
						) : null}

						{book.longDescription ? (
							<div className="prose prose-sm max-w-none text-[var(--muted)]">
								{book.longDescription.split("\n").map((line, i) => (
									<p key={i}>{line}</p>
								))}
							</div>
						) : null}

						{book.price > 0 ? (
							<form className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5" onSubmit={handleBuy}>
								<h2 className="font-display text-lg font-semibold text-[var(--ink)]">
									Purchase this book
								</h2>

								<div className="mt-4 grid gap-4">
									<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
										<Label>First name</Label>
										<Input
											className="h-11"
											required
											value={firstName}
											onChange={(e) => setFirstName(e.target.value)}
										/>
									</div>
									<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
										<Label>Last name</Label>
										<Input
											className="h-11"
											required
											value={lastName}
											onChange={(e) => setLastName(e.target.value)}
										/>
									</div>
									<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
										<Label>Email</Label>
										<Input
											className="h-11"
											required
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
									</div>

									{error ? (
										<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
											{error}
										</p>
									) : null}

									<Button type="submit" disabled={loading} size="lg">
										{loading ? "Redirecting..." : `Buy for ${formatUsd.format(book.price)}`}
									</Button>
								</div>
							</form>
						) : (
							<div className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
								<p className="text-sm font-semibold text-[var(--muted)]">
									This book is free. Download it at the link provided by the administrator.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
