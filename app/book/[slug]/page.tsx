import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookStorage } from "@/services/books-storage";
import { BookLanding } from "@/app/book/book-landing";

export const runtime = "nodejs";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const book = await BookStorage.findPublishedBySlug(slug);
	if (!book) {
		return { title: "Book not found" };
	}
	return {
		title: `${book.title} | InterJudaica`,
		description: book.description || `Purchase ${book.title}`,
	};
}

export default async function BookPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const book = await BookStorage.findPublishedBySlug(slug);

	if (!book) {
		notFound();
	}

	return <BookLanding book={book} />;
}
