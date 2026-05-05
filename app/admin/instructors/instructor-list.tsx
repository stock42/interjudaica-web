"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";

import type { TypeInstructor } from "@/models/instructors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InstructorList({
  instructors,
}: {
  instructors: TypeInstructor[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState("");
  const [deletingUuid, setDeletingUuid] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredInstructors = useMemo(
    () =>
      instructors.filter((instructor) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            instructor.displayName,
            instructor.firstName,
            instructor.lastName,
            instructor.email,
            instructor.slug,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesEnabled =
          !enabled || String(instructor.enabled) === enabled;

        return matchesQuery && matchesEnabled;
      }),
    [enabled, instructors, normalizedQuery],
  );

  async function deleteInstructor(instructor: TypeInstructor) {
    if (
      !instructor.uuid ||
      !window.confirm(`Delete ${instructor.displayName}?`)
    ) {
      return;
    }

    setDeletingUuid(instructor.uuid);

    const response = await fetch(`/api/admin/instructors/${instructor.uuid}`, {
      method: "DELETE",
    });

    setDeletingUuid("");

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/instructors");
      return;
    }

    if (!response.ok) {
      window.alert("The instructor could not be deleted.");
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
              Search instructors
              <Input
                className={adminTextControlClass}
                type="search"
                placeholder="Name, email, slug"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              <span>Status</span>
              <Select value={enabled} onValueChange={(value) => setEnabled(value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Enabled</SelectItem>
                <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <Button asChild size="lg" className="h-11">
            <Link href="/admin/instructors/new">New instructor</Link>
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[50rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-bold">Instructor</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstructors.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                    colSpan={5}
                  >
                    No instructors match the current search.
                  </td>
                </tr>
              ) : (
                filteredInstructors.map((instructor) => (
                  <tr
                    key={instructor.uuid}
                    className="border-t border-[var(--line)] align-middle"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--paper)]">
                          {instructor.photoUrl ? (
                            <Image
                              alt=""
                              className="object-cover"
                              fill
                              sizes="44px"
                              src={instructor.photoUrl}
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--ink)]">
                            {instructor.displayName}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {instructor.firstName} {instructor.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {instructor.email || "Not set"}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {instructor.slug}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
                        {instructor.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="xs" className="rounded-full">
                          <Link href={`/admin/instructors/${instructor.uuid}`}>Edit</Link>
                        </Button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={deletingUuid === instructor.uuid}
                          onClick={() => deleteInstructor(instructor)}
                        >
                          {deletingUuid === instructor.uuid
                            ? "Deleting"
                            : "Delete"}
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

