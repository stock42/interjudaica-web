import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookForm } from "@/app/admin/books/book-form";
import { AdminShell } from "@/app/components/portal-ui";
import { BookStorage } from "@/services/books-storage";

export const metadata: Metadata = {
	title: "Edit Book",
	description: "Edit a book in the public store.",
};

export const runtime = "nodejs";

export default async function EditBookPage({
	params,
}: {
	params: Promise<{ uuid: string }>;
}) {
	const { uuid } = await params;
	const book = await BookStorage.get(uuid);

	if (!book) {
		notFound();
	}

	return (
		<AdminShell
			title="Edit book"
			description="Update book details, pricing, and visibility."
		>
			<BookForm book={book} />
		</AdminShell>
	);
}
