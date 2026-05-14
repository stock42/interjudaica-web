"use client";

import { useState } from "react";

export function EmailPreferencesToggle({ enabled }: { enabled: boolean }) {
	const [checked, setChecked] = useState(enabled);
	const [saving, setSaving] = useState(false);

	async function handleToggle() {
		const next = !checked;
		setChecked(next);
		setSaving(true);
		await fetch("/api/user-auth/preferences", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ emailNotifications: next }),
		});
		setSaving(false);
	}

	return (
		<div className="mt-4 flex items-center gap-3">
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				disabled={saving}
				onClick={handleToggle}
				className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--sapphire)] focus:ring-offset-2 ${checked ? "bg-[var(--sapphire)]" : "bg-[var(--line)]"}`}
			>
				<span
					className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
				/>
			</button>
			<span className="text-sm font-semibold text-[var(--ink)]">
				Email notifications
			</span>
		</div>
	);
}
