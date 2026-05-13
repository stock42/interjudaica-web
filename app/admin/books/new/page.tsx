import type { Metadata } from "next";
import { BookForm } from "@/app/admin/books/book-form";
import { AdminShell } from "@/app/components/portal-ui";

export const metadata: Metadata = {
	title: "New Book",
	description: "Create a new book for the public store.",
};

export const runtime = "nodejs";

export default async function NewBookPage() {
	return (
		<AdminShell
			title="New book"
			description="Create a book record for the public store and checkout."
		>
			<BookForm />
		</AdminShell>
	);
}
