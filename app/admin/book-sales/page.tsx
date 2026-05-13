import type { Metadata } from "next";
import { BookSalesList } from "@/app/admin/book-sales/book-sales-list";
import { AdminShell } from "@/app/components/portal-ui";
import { BookSaleStorage } from "@/services/book-sales-storage";

export const metadata: Metadata = {
	title: "Admin Book Sales",
	description: "Review all book sales.",
};

export const runtime = "nodejs";

export default async function AdminBookSalesPage() {
	const sales = await BookSaleStorage.list();

	return (
		<AdminShell
			title="Book Sales"
			description="Review all completed and pending book purchases."
		>
			<BookSalesList sales={sales} />
		</AdminShell>
	);
}
