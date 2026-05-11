"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";

type CommunityRow = {
	uuid: string;
	userUuid: string;
	name: string;
	email: string;
	status: string;
	subscribedAt: string;
};

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

export function CommunityUsersList({ rows }: { rows: CommunityRow[] }) {
	const [query, setQuery] = useState("");
	const normalizedQuery = query.trim().toLowerCase();

	const filteredRows = useMemo(
		() =>
			rows.filter((row) => {
				const matchesQuery =
					!normalizedQuery ||
					[row.name, row.email, row.status]
						.join(" ")
						.toLowerCase()
						.includes(normalizedQuery);

				return matchesQuery;
			}),
		[rows, normalizedQuery],
	);

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Search members
					<Input
						className={adminTextControlClass}
						type="search"
						placeholder="Name, email"
						value={query}
							onChange={(event) => setQuery(event.target.value)}
					/>
				</label>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[48rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Member</th>
								<th className="px-4 py-3 font-bold">Status</th>
								<th className="px-4 py-3 font-bold">Subscribed</th>
							</tr>
						</thead>
						<tbody>
							{filteredRows.length === 0 ? (
								<tr>
									<td
										className="px-4 py-8 text-center text-sm text-[var(--muted)]"
										colSpan={3}
									>
										No community members yet.
									</td>
								</tr>
							) : (
								filteredRows.map((row) => (
									<tr
											key={row.uuid}
											className="border-t border-[var(--line)]"
										>
											<td className="px-4 py-4">
												<p className="font-semibold text-[var(--ink)]">
													{row.name}
												</p>
												<p className="mt-1 text-xs text-[var(--muted)]">
													{row.email}
												</p>
											</td>
											<td className="px-4 py-4">
												<span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
													{row.status}
												</span>
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{formatDate(row.subscribedAt)}
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
