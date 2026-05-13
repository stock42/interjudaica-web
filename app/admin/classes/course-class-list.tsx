"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";

import type { TypeCourse } from "@/models/courses";
import type { TypeCourseClass } from "@/models/course-classes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CourseClassList({
	course,
	classes,
}: {
	course: TypeCourse;
	classes: TypeCourseClass[];
}) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [deletingUuid, setDeletingUuid] = useState("");
	const normalizedQuery = query.trim().toLowerCase();

	const filteredClasses = useMemo(
		() =>
			classes.filter((item) => {
				const matchesQuery =
					!normalizedQuery ||
					[item.title, item.description]
						.join(" ")
						.toLowerCase()
						.includes(normalizedQuery);

				return matchesQuery;
			}),
		[classes, normalizedQuery],
	);

	async function deleteClass(item: TypeCourseClass) {
		if (!item.uuid || !window.confirm(`Delete ${item.title}?`)) {
			return;
		}

		setDeletingUuid(item.uuid);

		const response = await fetch(`/api/admin/classes/${item.uuid}`, {
			method: "DELETE",
		});

		setDeletingUuid("");

		if (response.status === 401) {
			window.location.assign(`/operator-login?next=/admin/classes/${course.uuid}`);
			return;
		}

		if (!response.ok) {
			window.alert("The class could not be deleted.");
			return;
		}

		router.refresh();
	}

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<form className="grid flex-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_auto]">
						<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
							Search classes
							<Input
								className={adminTextControlClass}
								type="search"
								placeholder="Title, description"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
							/>
						</label>
						<Link
							href={`/admin/courses/${course.uuid}`}
							className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
						>
							Back to course
						</Link>
					</form>
					<Button asChild size="lg" className="h-11">
						<Link href={`/admin/classes/${course.uuid}/new`}>
							New class
						</Link>
					</Button>
				</div>
			</section>

			<section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[48rem] border-collapse text-left text-sm">
						<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
							<tr>
								<th className="px-4 py-3 font-bold">Title</th>
								<th className="px-4 py-3 font-bold">Order</th>
								<th className="px-4 py-3 font-bold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredClasses.length === 0 ? (
								<tr>
									<td
										className="px-4 py-8 text-center text-sm text-[var(--muted)]"
										colSpan={3}
									>
										No classes match the current search.
									</td>
								</tr>
							) : (
								filteredClasses.map((item) => (
									<tr
											key={item.uuid}
											className="border-t border-[var(--line)] align-top"
										>
											<td className="px-4 py-4">
												<p className="font-semibold text-[var(--ink)]">
													{item.title}
												</p>
												{item.description ? (
													<p className="mt-1 text-xs text-[var(--muted)]">
														{item.description}
													</p>
												) : null}
											</td>
											<td className="px-4 py-4 text-[var(--muted)]">
												{item.order ?? 0}
											</td>
											<td className="px-4 py-4">
												<div className="flex flex-wrap gap-2">
													<Button asChild variant="outline" size="xs" className="rounded-full">
														<Link href={`/admin/classes/${course.uuid}/edit/${item.uuid}`}>
															Edit
														</Link>
													</Button>
													<button
														className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
														type="button"
														disabled={deletingUuid === item.uuid}
														onClick={() => deleteClass(item)}
													>
														{deletingUuid === item.uuid ? "Deleting" : "Delete"}
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
