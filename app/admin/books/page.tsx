import type { Metadata } from "next";
import { BookList } from "@/app/admin/books/book-list";
import { AdminShell } from "@/app/components/portal-ui";
import { BookStorage } from "@/services/books-storage";

export const metadata: Metadata = {
	title: "Admin Books",
	description: "Manage InterJudaica books for sale.",
};

export const runtime = "nodejs";

export default async function AdminBooksPage() {
	const books = await BookStorage.list();

	return (
		<AdminShell
			title="Books"
			description="Search, review, edit, and publish books for the public store."
		>
			<BookList books={books} />
		</AdminShell>
	);
}
