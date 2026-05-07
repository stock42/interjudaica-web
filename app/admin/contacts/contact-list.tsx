"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { TypeContact } from "@/models/contacts";
import { Input } from "@/components/ui/input";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";

function formatDate(value: string) {
	if (!value) {
		return "";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleString();
}

export function ContactList({ contacts }: { contacts: TypeContact[] }) {
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const normalizedQuery = query.trim().toLowerCase();

	const filteredContacts = useMemo(
		() =>
			contacts.filter((item) => {
				const matchesQuery =
					!normalizedQuery ||
					[
						item.firstName,
						item.lastName,
						item.email,
						item.message,
					]
						.join(" ")
						.toLowerCase()
						.includes(normalizedQuery);
				const matchesStatus =
					statusFilter === "all" || item.status === statusFilter;

				return matchesQuery && matchesStatus;
			}),
		[contacts, normalizedQuery, statusFilter],
	);

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<label className="grid flex-1 gap-2 text-sm font-semibold text-[var(--ink)]">
						Search contacts
						<Input
							className={adminTextControlClass}
							type="search"
							placeholder="Name, email, message"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</label>
					<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
						Status
						<select
							className={adminTextControlClass}
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value)}
						>
							<option value="all">All</option>
							<option value="new">New</option>
							<option value="replied">Replied</option>
						</select>
					</label>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[52rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Contact</th>
								<th className="px-4 py-3 font-bold">Status</th>
								<th className="px-4 py-3 font-bold">Received</th>
								<th className="px-4 py-3 font-bold">Action</th>
							</tr>
						</thead>
						<tbody>
							{filteredContacts.length === 0 ? (
								<tr>
									<td
										className="px-4 py-8 text-center text-sm text-[var(--muted)]"
										colSpan={4}
									>
										No contacts yet.
									</td>
								</tr>
							) : (
								filteredContacts.map((item) => (
									<tr
											key={item.uuid}
											className="border-t border-[var(--line)] align-top"
										>
											<td className="px-4 py-4">
												<p className="font-semibold text-[var(--ink)]">
													{item.firstName} {item.lastName}
												</p>
												<p className="mt-1 text-xs text-[var(--muted)]">
													{item.email}
												</p>
												<p className="mt-2 text-xs text-[var(--muted)] line-clamp-2">
													{item.message}
												</p>
											</td>
											<td className="px-4 py-4">
												<span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
													{item.status === "replied" ? "Replied" : "New"}
												</span>
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{formatDate(item.createdAt)}
											</td>
											<td className="px-4 py-4">
												<Link
													href={`/admin/contacts/${item.uuid}`}
													className="text-xs font-semibold text-[var(--sapphire)]"
												>
													View
												</Link>
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
