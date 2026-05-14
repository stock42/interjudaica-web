"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConfigEntry } from "@/models/config";

export function ConfigForm({ config }: { config: ConfigEntry[] }) {
	const router = useRouter();
	const [values, setValues] = useState<Record<string, string>>(() => {
		const map: Record<string, string> = {};
		for (const entry of config) {
			map[entry.key] = entry.value;
		}
		return map;
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const groups = new Map<string, ConfigEntry[]>();
	for (const entry of config) {
		const list = groups.get(entry.group) ?? [];
		list.push(entry);
		groups.set(entry.group, list);
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setLoading(true);
		setError("");
		setSuccess(false);

		const response = await fetch("/api/admin/config", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(values),
		});

		setLoading(false);

		if (response.status === 401) {
			window.location.assign("/operator-login?next=/admin/config");
			return;
		}

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			setError(data.error ?? "Could not save configuration.");
			return;
		}

		setSuccess(true);
		router.refresh();
		setTimeout(() => setSuccess(false), 3000);
	}

	return (
		<form className="grid gap-8" onSubmit={handleSubmit}>
			{Array.from(groups.entries()).map(([group, entries]) => (
				<section
					key={group}
					className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5"
				>
					<h2 className="font-display text-lg font-semibold text-[var(--ink)]">
						{group}
					</h2>
					<div className="mt-4 grid gap-4 md:grid-cols-2">
						{entries.map((entry) => (
							<div
								key={entry.key}
								className="grid gap-2 text-sm font-semibold text-[var(--ink)]"
							>
								<Label>{entry.label}</Label>
								<Input
									className="h-11"
									type={entry.type === "number" ? "number" : "text"}
									min={entry.type === "number" ? 1 : undefined}
									step={entry.type === "number" ? (entry.key.includes("mb") ? "0.1" : "1") : undefined}
									value={values[entry.key] ?? ""}
									onChange={(e) =>
										setValues((prev) => ({ ...prev, [entry.key]: e.target.value }))
									}
								/>
							</div>
						))}
					</div>
				</section>
			))}

			{error ? (
				<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</p>
			) : null}
			{success ? (
				<p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
					Configuration saved successfully.
				</p>
			) : null}

			<Button type="submit" disabled={loading}>
				{loading ? "Saving..." : "Save configuration"}
			</Button>
		</form>
	);
}
