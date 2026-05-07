"use client";

import { useMemo, useState } from "react";

import type { TypePasswordResetAttempt } from "@/models/password-reset-attempts";
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

export function PasswordResetList({
	attempts,
}: {
	attempts: TypePasswordResetAttempt[];
}) {
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const normalizedQuery = query.trim().toLowerCase();

	const filtered = useMemo(
		() =>
			attempts.filter((item) => {
				const matchesQuery =
					!normalizedQuery ||
					[item.email, item.reason, item.ip]
						.join(" ")
						.toLowerCase()
						.includes(normalizedQuery);
				const matchesStatus =
					statusFilter === "all" || item.status === statusFilter;

				return matchesQuery && matchesStatus;
			}),
		[attempts, normalizedQuery, statusFilter],
	);

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<label className="grid flex-1 gap-2 text-sm font-semibold text-[var(--ink)]">
						Search attempts
						<Input
							className={adminTextControlClass}
							type="search"
							placeholder="Email, reason, IP"
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
							<option value="success">Success</option>
							<option value="failed">Failed</option>
						</select>
					</label>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[52rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Email</th>
								<th className="px-4 py-3 font-bold">Status</th>
								<th className="px-4 py-3 font-bold">Reason</th>
								<th className="px-4 py-3 font-bold">IP</th>
								<th className="px-4 py-3 font-bold">Time</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<tr>
									<td
										className="px-4 py-8 text-center text-sm text-[var(--muted)]"
										colSpan={5}
									>
										No password reset attempts yet.
									</td>
								</tr>
							) : (
								filtered.map((item) => (
									<tr
											key={item.uuid}
											className="border-t border-[var(--line)] align-top"
										>
											<td className="px-4 py-4">
												<p className="font-semibold text-[var(--ink)]">
													{item.email}
												</p>
											</td>
											<td className="px-4 py-4">
												<span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
													{item.status === "success" ? "Success" : "Failed"}
												</span>
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{item.reason || "-"}
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{item.ip || "-"}
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{formatDate(item.createdAt)}
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
