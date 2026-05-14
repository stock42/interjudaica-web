"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultTranslations } from "@/models/translations";

const keys = Object.keys(defaultTranslations).sort();

export function TranslationEditor({ locales }: { locales: string[] }) {
	const router = useRouter();
	const [locale, setLocale] = useState<string>(locales[1] ?? "es");
	const [dictionary, setDictionary] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [aiLoading, setAiLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [search, setSearch] = useState("");
	const [aiLocale, setAiLocale] = useState("es");
	const [aiKey, setAiKey] = useState("");
	const [aiModel, setAiModel] = useState("");

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setLoading(true);
		fetch(`/api/admin/translations?locale=${locale}`)
			.then((res) => res.json())
			.then((data) => setDictionary(data.dictionary ?? {}))
			.finally(() => setLoading(false));
	}, [locale]);

	async function handleSave(event: FormEvent) {
		event.preventDefault();
		setLoading(true);
		setError("");

		const res = await fetch("/api/admin/translations", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ locale, translations: dictionary }),
		});

		setLoading(false);
		if (res.status === 401) {
			window.location.assign("/operator-login?next=/admin/translations");
			return;
		}
		if (!res.ok) {
			setError("Could not save translations.");
			return;
		}

		setSuccess(true);
		router.refresh();
		setTimeout(() => setSuccess(false), 3000);
	}

	async function handleAiTranslate() {
		if (!aiLocale) return;
		setAiLoading(true);
		setError("");

		const body: Record<string, string> = { locale: aiLocale };
		if (aiKey) body.apiKey = aiKey;
		if (aiModel) body.model = aiModel;

		const res = await fetch("/api/admin/translations/ai-translate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		const data = await res.json().catch(() => ({}));
		setAiLoading(false);

		if (!res.ok) {
			setError(data.error ?? "AI translation failed");
			return;
		}

		setDictionary((prev) => ({ ...prev, ...data.translated }));
		setLocale(aiLocale);
	}

	const filteredKeys = keys.filter((k) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return (
			k.toLowerCase().includes(q) ||
			defaultTranslations[k].toLowerCase().includes(q) ||
			(dictionary[k] ?? "").toLowerCase().includes(q)
		);
	});

	return (
		<div className="grid gap-5">
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<h2 className="font-display text-lg font-semibold text-[var(--ink)]">
					AI Assistant — Auto-translate
				</h2>
				<p className="mb-4 text-sm text-[var(--muted)]">
					Enter a target locale code (e.g. es, fr, de, pt) and click translate. Uses OpenAI by default. Provide your own API key or set OPENAI_API_KEY in env.
				</p>
				<div className="flex flex-wrap items-end gap-3">
					<div className="grid gap-1.5 text-sm font-semibold">
						<Label>Target locale</Label>
						<Input
							className="h-10 w-24"
							value={aiLocale}
							onChange={(e) => setAiLocale(e.target.value)}
							placeholder="es"
						/>
					</div>
					<div className="grid gap-1.5 text-sm font-semibold">
						<Label>API Key (optional)</Label>
						<Input
							className="h-10 w-56"
							type="password"
							value={aiKey}
							onChange={(e) => setAiKey(e.target.value)}
							placeholder="sk-..."
						/>
					</div>
					<div className="grid gap-1.5 text-sm font-semibold">
						<Label>Model (optional)</Label>
						<Input
							className="h-10 w-36"
							value={aiModel}
							onChange={(e) => setAiModel(e.target.value)}
							placeholder="gpt-4o-mini"
						/>
					</div>
					<Button
						type="button"
						onClick={handleAiTranslate}
						disabled={aiLoading || !aiLocale}
						className="flex items-center gap-2"
					>
						{aiLoading ? (
							"Translating..."
						) : (
							<>
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								AI Translate to {aiLocale}
							</>
						)}
					</Button>
				</div>
			</section>

			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="mb-4 flex flex-wrap items-end gap-3">
					<div className="grid gap-1.5 text-sm font-semibold">
						<Label>Editing locale</Label>
						<select
							className="h-10 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal"
							value={locale}
							onChange={(e) => setLocale(e.target.value)}
						>
							{locales.map((l) => (
								<option key={l} value={l}>
									{l} {l === "en" ? "(default)" : ""}
								</option>
							))}
						</select>
					</div>
					<div className="grid flex-1 gap-1.5 text-sm font-semibold">
						<Label>Search keys</Label>
						<Input
							className="h-10"
							type="search"
							placeholder="Search by key or value..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</div>

				{error ? (
					<p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
						{error}
					</p>
				) : null}
				{success ? (
					<p className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
						Translations saved successfully.
					</p>
				) : null}

				<form onSubmit={handleSave}>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[40rem] border-collapse text-left text-sm">
							<thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
								<tr>
									<th className="px-3 py-2 font-bold w-1/3">Key</th>
									<th className="px-3 py-2 font-bold">English (default)</th>
									<th className="px-3 py-2 font-bold">{locale}</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td className="px-3 py-8 text-center text-[var(--muted)]" colSpan={3}>
											Loading...
										</td>
									</tr>
								) : filteredKeys.length === 0 ? (
									<tr>
										<td className="px-3 py-8 text-center text-[var(--muted)]" colSpan={3}>
											No keys match.
										</td>
									</tr>
								) : (
									filteredKeys.map((key) => (
										<tr key={key} className="border-t border-[var(--line)]">
											<td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">
												{key}
											</td>
											<td className="px-3 py-2 text-[var(--ink)]">
												{defaultTranslations[key]}
											</td>
											<td className="px-3 py-2">
												<Input
													className="h-9 text-sm"
													value={dictionary[key] ?? ""}
													onChange={(e) =>
														setDictionary((prev) => ({
															...prev,
															[key]: e.target.value,
														}))
													}
													placeholder={defaultTranslations[key]}
												/>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<div className="mt-4 flex gap-3">
						<Button type="submit" disabled={loading}>
							Save translations
						</Button>
					</div>
				</form>
			</section>
		</div>
	);
}
