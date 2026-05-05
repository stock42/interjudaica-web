"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";

import type { TypeSafeOperator } from "@/models/operators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
              <Input
                className={adminTextControlClass}
                type="search"
                placeholder="Name, email, level"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              <span>Status</span>
              <Select value={enabled} onValueChange={(value) => setEnabled(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="true">Enabled</SelectItem>
                <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <Button asChild size="lg" className="h-11">
            <Link href="/admin/operators/new">New operator</Link>
          </Button>
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
                        <Button asChild variant="outline" size="xs" className="rounded-full">
                          <Link href={`/admin/operators/${operator.uuid}`}>Edit</Link>
                        </Button>
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
