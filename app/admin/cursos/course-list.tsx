"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TypeCourse } from "@/models/courses";

const formatUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function CourseList({ courses }: { courses: TypeCourse[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState("");
  const [deletingUuid, setDeletingUuid] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesQuery =
          !normalizedQuery ||
          [course.title, course.category, course.slug, course.instructor]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesStatus = !status || course.status === status;
        const matchesLevel = !level || course.level === level;

        return matchesQuery && matchesStatus && matchesLevel;
      }),
    [courses, level, normalizedQuery, status],
  );

  async function deleteCourse(course: TypeCourse) {
    if (!course.uuid || !window.confirm(`Delete ${course.title}?`)) {
      return;
    }

    setDeletingUuid(course.uuid);

    const response = await fetch(`/api/admin/courses/${course.uuid}`, {
      method: "DELETE",
    });

    setDeletingUuid("");

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/cursos");
      return;
    }

    if (!response.ok) {
      window.alert("The course could not be deleted.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem_12rem]">
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Search courses
              <input
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                type="search"
                placeholder="Title, category, slug, instructor"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Status
              <select
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Level
              <select
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                <option value="">All</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
          </form>

          <Link
            href="/admin/cursos/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#07090c] transition hover:bg-[#ffd66b]"
          >
            New course
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase text-[var(--muted)]">
          <span className="rounded-full bg-[var(--paper)] px-3 py-1">
            {filteredCourses.length} visible
          </span>
          <span className="rounded-full bg-[var(--paper)] px-3 py-1">
            {courses.length} total
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-bold">Course</th>
                <th className="px-4 py-3 font-bold">Level</th>
                <th className="px-4 py-3 font-bold">Price</th>
                <th className="px-4 py-3 font-bold">Community</th>
                <th className="px-4 py-3 font-bold">Duration</th>
                <th className="px-4 py-3 font-bold">Max students</th>
                <th className="px-4 py-3 font-bold">Start</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                    colSpan={9}
                  >
                    No courses match the current search.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr
                    key={course.uuid}
                    className="border-t border-[var(--line)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--ink)]">
                        {course.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {course.category} / {course.slug}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {course.level}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {formatUsd.format(course.price)}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {formatUsd.format(course.communityPrice)}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {course.durationHours ? `${course.durationHours} h` : "Not set"}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {course.maxStudents || "Not set"}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {course.startDate || "Not set"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/cursos/${course.uuid}`}
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-bold transition hover:bg-[var(--paper)]"
                        >
                          Edit
                        </Link>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={deletingUuid === course.uuid}
                          onClick={() => deleteCourse(course)}
                        >
                          {deletingUuid === course.uuid ? "Deleting" : "Delete"}
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
