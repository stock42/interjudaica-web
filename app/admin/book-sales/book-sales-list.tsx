"use client";

import { useMemo, useState } from "react";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";
import { AdminStatPill } from "@/app/admin/components/admin-stat-pill";
import { CSVExportButton } from "@/app/admin/components/csv-export-button";

import type { TypeBookSale } from "@/models/book-sales";
import { Input } from "@/components/ui/input";

const formatUsd = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

const statusLabel: Record<string, string> = {
	pending: "Pending",
	paid: "Paid",
	failed: "Failed",
};

const statusClass: Record<string, string> = {
	pending: "border-amber-200 bg-amber-50 text-amber-700",
	paid: "border-green-200 bg-green-50 text-green-700",
	failed: "border-red-200 bg-red-50 text-red-700",
};

export function BookSalesList({ sales }: { sales: TypeBookSale[] }) {
	const [query, setQuery] = useState("");
	const normalizedQuery = query.trim().toLowerCase();

	const filteredSales = useMemo(
		() =>
			sales.filter((sale) => {
				if (!normalizedQuery) return true;
				return [sale.bookTitle, sale.buyerFirstName, sale.buyerLastName, sale.buyerEmail]
					.join(" ")
					.toLowerCase()
					.includes(normalizedQuery);
			}),
		[sales, normalizedQuery],
	);

	const totalRevenue = useMemo(
		() =>
			filteredSales
				.filter((s) => s.status === "paid")
				.reduce((sum, s) => sum + s.amount, 0),
		[filteredSales],
	);

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<label className="grid gap-2 text-sm font-semibold text-[var(--ink)] max-w-md">
						Search sales
						<Input
							className={adminTextControlClass}
							type="search"
							placeholder="Book title, buyer name, email"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</label>
					<CSVExportButton
						data={sales}
						columns={[
							{ key: "bookTitle", label: "Book" },
							{ key: "buyerFirstName", label: "First Name" },
							{ key: "buyerLastName", label: "Last Name" },
							{ key: "buyerEmail", label: "Email" },
							{ key: "amount", label: "Amount" },
							{ key: "status", label: "Status" },
						]}
						filename="book-sales"
					/>
				</div>
				<div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase text-[var(--muted)]">
					<AdminStatPill>{filteredSales.length} visible</AdminStatPill>
					<AdminStatPill>{sales.length} total</AdminStatPill>
					<AdminStatPill>
						{formatUsd.format(totalRevenue)} in paid revenue
					</AdminStatPill>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[48rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Book</th>
								<th className="px-4 py-3 font-bold">Buyer</th>
								<th className="px-4 py-3 font-bold">Email</th>
								<th className="px-4 py-3 font-bold">Amount</th>
								<th className="px-4 py-3 font-bold">Status</th>
								<th className="px-4 py-3 font-bold">Date</th>
							</tr>
						</thead>
						<tbody>
							{filteredSales.length === 0 ? (
								<tr>
									<td className="px-4 py-8 text-center text-sm text-[var(--muted)]" colSpan={6}>
										No sales match the current search.
									</td>
								</tr>
							) : (
								filteredSales.map((sale) => (
									<tr key={sale.uuid} className="border-t border-[var(--line)] align-top">
										<td className="px-4 py-4">
											<p className="font-semibold text-[var(--ink)]">{sale.bookTitle}</p>
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{sale.buyerFirstName} {sale.buyerLastName}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{sale.buyerEmail}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{formatUsd.format(sale.amount)}
										</td>
										<td className="px-4 py-4">
											<span
												className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass[sale.status] ?? ""}`}
											>
												{statusLabel[sale.status] ?? sale.status}
											</span>
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											{sale.paidAt
												? new Date(sale.paidAt).toLocaleDateString()
												: sale.createdAt
													? new Date(sale.createdAt).toLocaleDateString()
													: "N/A"}
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
