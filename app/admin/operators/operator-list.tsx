"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TypeSafeOperator } from "@/models/operators";

export function OperatorList({
  operators,
}: {
  operators: TypeSafeOperator[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState("");
  const [deletingUuid, setDeletingUuid] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredOperators = useMemo(
    () =>
      operators.filter((operator) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            operator.firstName,
            operator.lastName,
            operator.email,
            String(operator.level),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesEnabled =
          !enabled || String(operator.enabled) === enabled;

        return matchesQuery && matchesEnabled;
      }),
    [enabled, normalizedQuery, operators],
  );

  async function deleteOperator(operator: TypeSafeOperator) {
    if (!window.confirm(`Delete ${operator.email}?`)) {
      return;
    }

    setDeletingUuid(operator.uuid);

    const response = await fetch(`/api/admin/operators/${operator.uuid}`, {
      method: "DELETE",
    });

    setDeletingUuid("");

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/operators");
      return;
    }

    if (!response.ok) {
      window.alert("The operator could not be deleted.");
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
              Search operators
              <input
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                type="search"
                placeholder="Name, email, level"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Status
              <select
                className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                value={enabled}
                onChange={(event) => setEnabled(event.target.value)}
              >
                <option value="">All</option>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </label>
          </form>
          <Link
            href="/admin/operators/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--sapphire)] hover:bg-[var(--sapphire)]"
          >
            New operator
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-bold">Operator</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Level</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperators.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                    colSpan={5}
                  >
                    No operators match the current search.
                  </td>
                </tr>
              ) : (
                filteredOperators.map((operator) => (
                  <tr
                    key={operator.uuid}
                    className="border-t border-[var(--line)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--ink)]">
                        {[operator.firstName, operator.lastName]
                          .filter(Boolean)
                          .join(" ") || "Unnamed operator"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {operator.email}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {operator.level}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
                        {operator.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/operators/${operator.uuid}`}
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-bold transition hover:bg-[var(--paper)]"
                        >
                          Edit
                        </Link>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={deletingUuid === operator.uuid}
                          onClick={() => deleteOperator(operator)}
                        >
                          {deletingUuid === operator.uuid
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
