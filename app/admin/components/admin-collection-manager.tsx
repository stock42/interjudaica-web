"use client";

import { useMemo, useState, type FormEvent } from "react";

type AdminKind =
  | "course-categories"
  | "courses"
  | "forums"
  | "instructors"
  | "papers"
  | "users";
type AdminRecord = Record<string, unknown> & {
  uuid?: string;
};

type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "textarea-list";
  options?: string[];
  placeholder?: string;
  span?: "full";
};

type ColumnConfig = {
  label: string;
  value: (item: AdminRecord) => string;
};

type EntityConfig = {
  api: string;
  singular: string;
  plural: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
};

const controlClass =
  "min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

const textareaClass =
  "min-h-28 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]";

const configs: Record<AdminKind, EntityConfig> = {
  "course-categories": {
    api: "/api/admin/course-categories",
    singular: "course category",
    plural: "course categories",
    fields: [
      { name: "name", label: "Name" },
      { name: "description", label: "Description", type: "textarea", span: "full" },
      { name: "enabled", label: "Enabled", type: "checkbox" },
    ],
    columns: [
      { label: "Category", value: (item) => String(item.name ?? "") },
      { label: "Slug", value: (item) => String(item.slug ?? "") },
      { label: "Enabled", value: (item) => (item.enabled ? "Yes" : "No") },
      { label: "Description", value: (item) => String(item.description ?? "") },
    ],
  },
  courses: {
    api: "/api/admin/courses",
    singular: "course",
    plural: "courses",
    fields: [
      { name: "title", label: "Title" },
      { name: "slug", label: "Slug" },
      { name: "category", label: "Category" },
      {
        name: "level",
        label: "Level",
        type: "select",
        options: ["Beginner", "Intermediate", "Advanced"],
      },
      { name: "price", label: "Price", type: "number" },
      { name: "communityPrice", label: "Community price", type: "number" },
      { name: "duration", label: "Duration" },
      { name: "startDate", label: "Start date" },
      { name: "endDate", label: "End date" },
      { name: "instructor", label: "Instructor" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["draft", "published", "archived"],
      },
      { name: "stripePaymentLink", label: "Stripe link" },
      { name: "summary", label: "Summary", type: "textarea", span: "full" },
      { name: "description", label: "Description", type: "textarea", span: "full" },
      { name: "includes", label: "Includes", type: "textarea-list", span: "full" },
      { name: "outcomes", label: "Outcomes", type: "textarea-list", span: "full" },
    ],
    columns: [
      { label: "Course", value: (item) => String(item.title ?? "") },
      { label: "Level", value: (item) => String(item.level ?? "") },
      { label: "Price", value: (item) => `$${Number(item.price ?? 0)}` },
      { label: "Status", value: (item) => String(item.status ?? "") },
      { label: "Start", value: (item) => String(item.startDate ?? "") },
    ],
  },
  papers: {
    api: "/api/admin/papers",
    singular: "paper",
    plural: "papers",
    fields: [
      { name: "title", label: "Title" },
      { name: "slug", label: "Slug" },
      { name: "category", label: "Category" },
      { name: "date", label: "Date" },
      { name: "author", label: "Author" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["draft", "published", "archived"],
      },
      {
        name: "visibility",
        label: "Visibility",
        type: "select",
        options: ["public", "community", "private"],
      },
      { name: "summary", label: "Summary", type: "textarea", span: "full" },
      { name: "content", label: "Content", type: "textarea", span: "full" },
    ],
    columns: [
      { label: "Paper", value: (item) => String(item.title ?? "") },
      { label: "Category", value: (item) => String(item.category ?? "") },
      { label: "Visibility", value: (item) => String(item.visibility ?? "") },
      { label: "Status", value: (item) => String(item.status ?? "") },
      { label: "Date", value: (item) => String(item.date ?? "") },
    ],
  },
  forums: {
    api: "/api/admin/forums",
    singular: "thread",
    plural: "threads",
    fields: [
      { name: "title", label: "Title" },
      { name: "slug", label: "Slug" },
      { name: "area", label: "Area" },
      { name: "courseSlug", label: "Course slug" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["open", "closed", "hidden"],
      },
      { name: "featured", label: "Featured", type: "checkbox" },
      { name: "repliesCount", label: "Replies", type: "number" },
      { name: "unreadCount", label: "Unread", type: "number" },
      { name: "lastActivityAt", label: "Last activity" },
    ],
    columns: [
      { label: "Thread", value: (item) => String(item.title ?? "") },
      { label: "Area", value: (item) => String(item.area ?? "") },
      { label: "Replies", value: (item) => String(item.repliesCount ?? 0) },
      { label: "Status", value: (item) => String(item.status ?? "") },
      { label: "Featured", value: (item) => (item.featured ? "Yes" : "No") },
    ],
  },
  instructors: {
    api: "/api/admin/instructors",
    singular: "instructor",
    plural: "instructors",
    fields: [
      { name: "firstName", label: "First name" },
      { name: "lastName", label: "Last name" },
      { name: "displayName", label: "Display name" },
      { name: "email", label: "Email" },
      { name: "photoUrl", label: "Photo URL" },
      { name: "enabled", label: "Enabled", type: "checkbox" },
      { name: "bio", label: "Bio", type: "textarea", span: "full" },
    ],
    columns: [
      { label: "Instructor", value: (item) => String(item.displayName ?? "") },
      { label: "Email", value: (item) => String(item.email ?? "") },
      { label: "Slug", value: (item) => String(item.slug ?? "") },
      { label: "Enabled", value: (item) => (item.enabled ? "Yes" : "No") },
    ],
  },
  users: {
    api: "/api/admin/users",
    singular: "user",
    plural: "users",
    fields: [
      { name: "firstName", label: "First name" },
      { name: "lastName", label: "Last name" },
      { name: "email", label: "Email" },
      { name: "country", label: "Country" },
      { name: "state", label: "State" },
      { name: "city", label: "City" },
      { name: "role", label: "Role" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["active", "disabled", "pending"],
      },
      {
        name: "communityStatus",
        label: "Community",
        type: "select",
        options: ["none", "active", "cancelled", "manual"],
      },
    ],
    columns: [
      {
        label: "User",
        value: (item) =>
          `${String(item.firstName ?? "")} ${String(item.lastName ?? "")}`.trim(),
      },
      { label: "Email", value: (item) => String(item.email ?? "") },
      {
        label: "Location",
        value: (item) =>
          [item.city, item.state, item.country].filter(Boolean).join(", "),
      },
      { label: "Role", value: (item) => String(item.role ?? "") },
      { label: "Status", value: (item) => String(item.status ?? "") },
      { label: "Community", value: (item) => String(item.communityStatus ?? "") },
    ],
  },
};

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
      <section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {items.length} {config.plural}
            </p>
          </div>
          {editingUuid ? (
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          ) : null}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <label
              key={field.name}
              className={`grid gap-2 text-sm font-semibold text-[var(--ink)] ${
                field.span === "full" ? "md:col-span-2" : ""
              }`}
            >
              {field.label}
              {field.type === "textarea" || field.type === "textarea-list" ? (
                <textarea
                  className={textareaClass}
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
                <select
                  className={controlClass}
                  value={String(form[field.name] ?? "")}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  className="h-5 w-5 rounded border border-[var(--line)] accent-[var(--sapphire)]"
                  type="checkbox"
                  checked={Boolean(form[field.name])}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.name]: event.target.checked,
                    }))
                  }
                />
              ) : (
                <input
                  className={controlClass}
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
            </label>
          ))}

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#07090c] transition hover:bg-[#ffd66b] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--paper)]"
              type="button"
              onClick={resetForm}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

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
