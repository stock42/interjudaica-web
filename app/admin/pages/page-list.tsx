"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";
import { AdminStatPill } from "@/app/admin/components/admin-stat-pill";

import type { TypePage } from "@/models/pages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PageList({ pages }: { pages: TypePage[] }) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("");
	const [deletingUuid, setDeletingUuid] = useState("");
	const normalizedQuery = query.trim().toLowerCase();

	const filteredPages = useMemo(
		() =>
			pages.filter((page) => {
				const matchesQuery =
					!normalizedQuery ||
					[page.title, page.slug, page.description]
						.join(" ")
						.toLowerCase()
						.includes(normalizedQuery);
				const matchesStatus = !status || page.status === status;
				return matchesQuery && matchesStatus;
			}),
		[pages, normalizedQuery, status],
	);

	async function deletePage(page: TypePage) {
		if (!page.uuid || !window.confirm(`Delete ${page.title}?`)) {
			return;
		}
		setDeletingUuid(page.uuid);
		const response = await fetch(`/api/admin/pages/${page.uuid}`, {
			method: "DELETE",
		});
		setDeletingUuid("");
		if (response.status === 401) {
			window.location.assign("/operator-login?next=/admin/pages");
			return;
		}
		if (!response.ok) {
			window.alert("The page could not be deleted.");
			return;
		}
		router.refresh();
	}

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<form className="grid flex-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem]">
						<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
							Search pages
							<Input
								className={adminTextControlClass}
								type="search"
								placeholder="Title, slug, description"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
							/>
						</label>
						<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
							<span>Status</span>
							<Select value={status} onValueChange={(value) => setStatus(value === "__all__" ? "" : value)}>
								<SelectTrigger className="h-11 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__all__">All</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="published">Published</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</form>
					<Button asChild size="lg" className="h-11">
						<Link href="/admin/pages/new">New page</Link>
					</Button>
				</div>
				<div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase text-[var(--muted)]">
					<AdminStatPill>{filteredPages.length} visible</AdminStatPill>
					<AdminStatPill>{pages.length} total</AdminStatPill>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[40rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Page</th>
								<th className="px-4 py-3 font-bold">Slug</th>
								<th className="px-4 py-3 font-bold">Status</th>
								<th className="px-4 py-3 font-bold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredPages.length === 0 ? (
								<tr>
									<td className="px-4 py-8 text-center text-sm text-[var(--muted)]" colSpan={4}>
										No pages match the current search.
									</td>
								</tr>
							) : (
								filteredPages.map((page) => (
									<tr key={page.uuid} className="border-t border-[var(--line)] align-top">
										<td className="px-4 py-4">
											<p className="font-semibold text-[var(--ink)]">{page.title}</p>
											{page.description ? (
												<p className="mt-1 text-xs text-[var(--muted)] line-clamp-1">
													{page.description}
												</p>
											) : null}
										</td>
										<td className="px-4 py-4 text-[var(--muted)]">
											/page/{page.slug}
										</td>
										<td className="px-4 py-4">
											<span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
												{page.status}
											</span>
										</td>
										<td className="px-4 py-4">
											<div className="flex flex-wrap gap-2">
												<Button asChild variant="outline" size="xs" className="rounded-full">
													<Link href={`/admin/pages/${page.uuid}`}>Edit</Link>
												</Button>
												<button
													className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
													type="button"
													disabled={deletingUuid === page.uuid}
													onClick={() => deletePage(page)}
												>
													{deletingUuid === page.uuid ? "Deleting" : "Delete"}
												</button>
											</div>
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
