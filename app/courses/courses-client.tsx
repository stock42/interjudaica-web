"use client";

import { useState, useMemo } from "react";
import { CourseGrid } from "@/app/components/portal-ui-client";
import type { TypePublicCourse } from "@/models/courses";

export function CoursesPageClient({
	courses,
}: {
	courses: TypePublicCourse[];
}) {
	const [price, setPrice] = useState("any");
	const [level, setLevel] = useState("any");
	const [start, setStart] = useState("any");
	const [search, setSearch] = useState("");

	const startOptions = useMemo(() => {
		const dates = new Set<string>();
		for (const c of courses) {
			if (c.startDate) dates.add(c.startDate);
		}
		return Array.from(dates).sort();
	}, [courses]);

	const filtered = useMemo(() => {
		let result = courses;

		if (price === "free") {
			result = result.filter((c) => c.price === 0);
		} else if (price === "under200") {
			result = result.filter((c) => c.price > 0 && c.price < 200);
		} else if (price === "over200") {
			result = result.filter((c) => c.price >= 200);
		}

		if (level !== "any") {
			result = result.filter((c) => c.level === level);
		}

		if (start !== "any") {
			result = result.filter((c) => c.startDate === start);
		}

		if (search.trim()) {
			const q = search.toLowerCase().trim();
			result = result.filter(
				(c) =>
					c.title.toLowerCase().includes(q) ||
					c.category.toLowerCase().includes(q) ||
					c.summary.toLowerCase().includes(q) ||
					c.description.toLowerCase().includes(q) ||
					c.instructor.toLowerCase().includes(q),
			);
		}

		return result;
	}, [courses, price, level, start, search]);

	return (
		<>
			<div className="mb-8 grid gap-3 rounded-lg border border-[var(--line)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
				<label className="grid gap-2 text-sm font-semibold">
					Price
					<select
						className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
					>
						<option value="any">Any price</option>
						<option value="free">Free</option>
						<option value="under200">Under $200 USD</option>
						<option value="over200">$200 USD and above</option>
					</select>
				</label>
				<label className="grid gap-2 text-sm font-semibold">
					Level
					<select
						className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3"
						value={level}
						onChange={(e) => setLevel(e.target.value)}
					>
						<option value="any">Any level</option>
						<option value="Beginner">Beginner</option>
						<option value="Intermediate">Intermediate</option>
						<option value="Advanced">Advanced</option>
					</select>
				</label>
				<label className="grid gap-2 text-sm font-semibold">
					Start date
					<select
						className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3"
						value={start}
						onChange={(e) => setStart(e.target.value)}
					>
						<option value="any">All cohorts</option>
						{startOptions.map((date) => (
							<option key={date} value={date}>
								{new Date(date).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-2 text-sm font-semibold">
					Search
					<input
						className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3"
						placeholder="Talmud, Hebrew, prayer"
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</label>
			</div>

			<CourseGrid items={filtered} />
			{filtered.length === 0 && (
				<p className="mt-4 text-sm text-[var(--muted)]">
					No courses match your filters. Try adjusting the criteria.
				</p>
			)}
		</>
	);
}
