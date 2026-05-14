import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookStorage } from "@/services/books-storage";

export const metadata: Metadata = {
	title: "Books | InterJudaica",
	description: "Browse and purchase our publications.",
};

export const runtime = "nodejs";

export default async function BooksPage() {
	const books = await BookStorage.listPublished();

	return (
		<main className="min-h-screen bg-[var(--paper)]">
			<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
				<h1 className="font-display text-4xl font-bold text-[var(--ink)]">Books</h1>
				<p className="mt-3 max-w-xl text-base text-[var(--muted)]">
					Browse and purchase our publications.
				</p>

				{books.length === 0 ? (
					<div className="mt-12 rounded-lg border border-[var(--line)] bg-white p-8 text-center">
						<p className="text-sm font-semibold text-[var(--muted)]">
							No books available yet.
						</p>
					</div>
				) : (
					<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{books.map((book) => (
							<Link
								key={book.uuid}
								href={`/book/${book.slug}`}
								className="group rounded-lg border border-[var(--line)] bg-white p-4 transition hover:shadow-md"
							>
								<div className="relative aspect-[3/4] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
									{book.coverUrl ? (
										<Image
											alt={book.title}
											src={book.coverUrl}
											fill
											className="object-cover transition group-hover:scale-105"
											sizes="(max-width: 768px) 50vw, 33vw"
										/>
									) : (
										<div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
											No cover
										</div>
									)}
								</div>
								<h2 className="mt-3 font-semibold text-[var(--ink)] group-hover:text-[var(--sapphire)]">
									{book.title}
								</h2>
								{book.description ? (
									<p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
										{book.description}
									</p>
								) : null}
								<p className="mt-2 text-lg font-bold text-[var(--ink)]">
									{book.price > 0
										? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(book.price)
										: "Free"}
								</p>
							</Link>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
