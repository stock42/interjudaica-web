"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";
import { AdminStatPill } from "@/app/admin/components/admin-stat-pill";

import type { TypeBook } from "@/models/books";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatUsd = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

export function BookList({ books }: { books: TypeBook[] }) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("");
	const [deletingUuid, setDeletingUuid] = useState("");
	const normalizedQuery = query.trim().toLowerCase();

	const filteredBooks = useMemo(
		() =>
			books.filter((book) => {
				const matchesQuery =
					!normalizedQuery ||
					[book.title, book.slug, book.description]
						.join(" ")
						.toLowerCase()
						.includes(normalizedQuery);
				const matchesStatus = !status || book.status === status;
				return matchesQuery && matchesStatus;
			}),
		[books, normalizedQuery, status],
	);

	async function deleteBook(book: TypeBook) {
		if (!book.uuid || !window.confirm(`Delete ${book.title}?`)) {
			return;
		}
		setDeletingUuid(book.uuid);
		const response = await fetch(`/api/admin/books/${book.uuid}`, {
			method: "DELETE",
		});
		setDeletingUuid("");
		if (response.status === 401) {
			window.location.assign("/operator-login?next=/admin/books");
			return;
		}
		if (!response.ok) {
			window.alert("The book could not be deleted.");
			return;
		}
		router.refresh();
	}

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<form className="grid flex-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem]">
						<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
							Search books
							<Input
								className={adminTextControlClass}
								type="search"
								placeholder="Title, slug, description"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
							/>
						</label>
						<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
							<span>Status</span>
							<Select value={status} onValueChange={(value) => setStatus(value === "__all__" ? "" : value)}>
								<SelectTrigger className="h-11 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__all__">All</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="published">Published</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</form>
					<Button asChild size="lg" className="h-11">
						<Link href="/admin/books/new">New book</Link>
					</Button>
				</div>
				<div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase text-[var(--muted)]">
					<AdminStatPill>{filteredBooks.length} visible</AdminStatPill>
					<AdminStatPill>{books.length} total</AdminStatPill>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[48rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Book</th>
								<th className="px-4 py-3 font-bold">Price</th>
								<th className="px-4 py-3 font-bold">Cover</th>
								<th className="px-4 py-3 font-bold">File</th>
								<th className="px-4 py-3 font-bold">Status</th>
								<th className="px-4 py-3 font-bold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredBooks.length === 0 ? (
								<tr>
									<td className="px-4 py-8 text-center text-sm text-[var(--muted)]" colSpan={6}>
										No books match the current search.
									</td>
								</tr>
							) : (
								filteredBooks.map((book) => (
									<tr key={book.uuid} className="border-t border-[var(--line)] align-top">
										<td className="px-4 py-4">
											<p className="font-semibold text-[var(--ink)]">{book.title}</p>
											<p className="mt-1 text-xs text-[var(--muted)]">
												/{book.slug}
											</p>
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{book.price > 0 ? formatUsd.format(book.price) : "Free"}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{book.coverUrl ? "Yes" : "No"}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{book.filePath ? "Yes" : "No"}
										</td>
										<td className="px-4 py-4">
											<span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
												{book.status}
											</span>
										</td>
										<td className="px-4 py-4">
											<div className="flex flex-wrap gap-2">
												<Button asChild variant="outline" size="xs" className="rounded-full">
													<Link href={`/admin/books/${book.uuid}`}>Edit</Link>
												</Button>
												<button
													className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
													type="button"
													disabled={deletingUuid === book.uuid}
													onClick={() => deleteBook(book)}
												>
													{deletingUuid === book.uuid ? "Deleting" : "Delete"}
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
