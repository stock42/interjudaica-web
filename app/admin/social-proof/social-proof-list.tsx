"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminTextControlClass } from "@/app/admin/components/admin-controls";

import type { TypeSocialProof } from "@/models/social-proof";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import AiCreateModal from "@/app/admin/components/ai-create-modal";

export function SocialProofList({ items }: { items: TypeSocialProof[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [deletingUuid, setDeletingUuid] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery =
          !normalizedQuery ||
          [item.quote, item.name, item.detail]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesStatus = !status || item.status === status;

        return matchesQuery && matchesStatus;
      }),
    [items, normalizedQuery, status],
  );

  async function deleteItem(item: TypeSocialProof) {
    if (!item.uuid || !window.confirm(`Delete ${item.name}?`)) {
      return;
    }

    setDeletingUuid(item.uuid);

    const response = await fetch(`/api/admin/social-proof/${item.uuid}`, {
      method: "DELETE",
    });

    setDeletingUuid("");

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin/social-proof");
      return;
    }

    if (!response.ok) {
      window.alert("The testimonial could not be deleted.");
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
              Search testimonials
              <Input
                className={adminTextControlClass}
                type="search"
                placeholder="Quote, name, detail"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              <span>Status</span>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value === "__all__" ? "" : value)
                }
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <Button asChild size="lg" className="h-11">
            <Link href="/admin/social-proof/new">New testimonial</Link>
          </Button>
          <AiCreateModal
            entityType="testimonial"
            entityName="Testimonial"
            trigger={
              <Button variant="outline" size="sm" className="h-10 gap-1.5">
                <Sparkles className="size-4 text-[var(--gold)]" />
                AI Create
              </Button>
            }
            onCreate={async (data) => {
              const response = await fetch("/api/admin/social-proof", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              if (response.status === 401) {
                window.location.assign("/operator-login?next=/admin/social-proof");
                return;
              }
              if (!response.ok) {
                const json = await response.json().catch(() => ({}));
                throw new Error(json.error ?? "Failed to create testimonial");
              }
              router.refresh();
            }}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-bold">Quote</th>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Detail</th>
                <th className="px-4 py-3 font-bold">Order</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                    colSpan={6}
                  >
                    No testimonials match the current search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.uuid}
                    className="border-t border-[var(--line)] align-top"
                  >
                    <td className="max-w-md px-4 py-4 text-[var(--muted)]">
                      {item.quote}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--ink)]">
                        {item.name}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {item.detail}
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {item.order ?? 0}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-bold uppercase text-[var(--muted)]">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="xs"
                          className="rounded-full"
                        >
                          <Link href={`/admin/social-proof/${item.uuid}`}>
                            Edit
                          </Link>
                        </Button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={deletingUuid === item.uuid}
                          onClick={() => deleteItem(item)}
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
