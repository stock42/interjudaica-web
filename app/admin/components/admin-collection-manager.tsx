"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AdminKind =
  | "course-categories"
  | "courses"
  | "forums"
  | "instructors"
  | "papers"
  | "users"
  | "coupons";
export type AdminRecord = Record<string, unknown> & {
  uuid?: string;
};

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "textarea-list";
  options?: string[];
  placeholder?: string;
  span?: "full";
};

export type ColumnConfig = {
  label: string;
  value: (item: AdminRecord) => string;
};

export type EntityConfig = {
  api: string;
  singular: string;
  plural: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  noCreate?: boolean;
};


import { configs } from "@/app/admin/configs/admin-collection-configs";

function emptyForm(fields: FieldConfig[]) {
  return fields.reduce<Record<string, string | boolean>>((acc, field) => {
    acc[field.name] = field.type === "checkbox" ? false : "";
    return acc;
  }, {});
}

function formFromItem(fields: FieldConfig[], item: AdminRecord) {
  return fields.reduce<Record<string, string | boolean>>((acc, field) => {
    const value = item[field.name];

    if (field.type === "checkbox") {
      acc[field.name] = Boolean(value);
    } else if (field.type === "textarea-list" && Array.isArray(value)) {
      acc[field.name] = value.join("\n");
    } else {
      acc[field.name] = value === undefined ? "" : String(value);
    }

    return acc;
  }, {});
}

function buildPayload(fields: FieldConfig[], form: Record<string, string | boolean>) {
  return fields.reduce<AdminRecord>((acc, field) => {
    const value = form[field.name];

    if (field.type === "number") {
      acc[field.name] = Number(value || 0);
    } else if (field.type === "checkbox") {
      acc[field.name] = Boolean(value);
    } else if (field.type === "textarea-list") {
      acc[field.name] = String(value ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    } else {
      acc[field.name] = String(value ?? "").trim();
    }

    return acc;
  }, {});
}

export function AdminCollectionManager({
  kind,
  initialItems,
}: {
  kind: AdminKind;
  initialItems: AdminRecord[];
}) {
  const config = configs[kind];
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [form, setForm] = useState(() => emptyForm(config.fields));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const editingUuid = editing?.uuid;

  const title = useMemo(
    () => (editingUuid ? `Edit ${config.singular}` : `New ${config.singular}`),
    [config.singular, editingUuid],
  );

  async function refresh() {
    const response = await fetch(config.api);

    if (response.status === 401) {
      window.location.assign("/operator-login?next=/admin");
      return;
    }

    const data = await response.json();
    setItems(data.items ?? []);
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyForm(config.fields));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(editingUuid ? `${config.api}/${editingUuid}` : config.api, {
      method: editingUuid ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(config.fields, form)),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The record could not be saved.");
      return;
    }

    resetForm();
    await refresh();
  }

  async function handleDelete(item: AdminRecord) {
    if (!item.uuid || !window.confirm(`Delete this ${config.singular}?`)) {
      return;
    }

    const response = await fetch(`${config.api}/${item.uuid}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "The record could not be deleted.");
      return;
    }

    await refresh();
  }

  return (
    <div className="grid gap-5">
      {config.noCreate ? null : (
      <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {items.length} {config.plural}
            </p>
          </div>
          {editingUuid ? (
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
          ) : null}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <div
              key={field.name}
              className={`grid gap-2 text-sm font-semibold text-[var(--ink)] ${
                field.span === "full" ? "md:col-span-2" : ""
              }`}
            >
              <Label>{field.label}</Label>
              {field.type === "textarea" || field.type === "textarea-list" ? (
                <Textarea
                  className="min-h-28"
                  value={String(form[field.name] ?? "")}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                />
               ) : field.type === "select" ? (
                <Select
                  value={String(form[field.name] ?? "")}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      [field.name]: value === "__none__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select</SelectItem>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
               ) : field.type === "checkbox" ? (
                <div className="flex items-center justify-between gap-4 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3">
                  <span className="text-sm font-semibold text-[var(--ink)]">{field.label}</span>
                  <Switch
                    checked={Boolean(form[field.name])}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        [field.name]: Boolean(checked),
                      }))
                    }
                  />
                </div>
              ) : (

                <Input
                  className="h-11"
                  type={field.type === "number" ? "number" : "text"}
                  value={String(form[field.name] ?? "")}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Clear
            </Button>
          </div>
        </form>
      </section>
      )}

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
              <tr>
                {config.columns.map((column) => (
                  <th key={column.label} className="px-4 py-3 font-bold">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                    colSpan={config.columns.length + 1}
                  >
                    No records yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.uuid}
                    className="border-t border-[var(--line)] align-top"
                  >
                    {config.columns.map((column) => (
                      <td key={column.label} className="px-4 py-4 text-[var(--muted)]">
                        {column.value(item)}
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-bold transition hover:bg-[var(--paper)]"
                          type="button"
                          onClick={() => {
                            setEditing(item);
                            setForm(formFromItem(config.fields, item));
                            setError("");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50"
                          type="button"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
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
