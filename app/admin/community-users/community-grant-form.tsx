"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TypeSafeUser } from "@/models/users";

export function CommunityGrantForm({ users }: { users: TypeSafeUser[] }) {
	const router = useRouter();
	const [userUuid, setUserUuid] = useState("");
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
		"idle",
	);
	const [error, setError] = useState("");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("saving");
		setError("");

		const response = await fetch("/api/admin/community-users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userUuid }),
		});

		if (response.status === 401) {
			window.location.assign("/operator-login?next=/admin/community-users");
			return;
		}

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			setError(data.error ?? "Unable to grant access.");
			setStatus("error");
			return;
		}

		setStatus("saved");
		router.refresh();
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-5">
			<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<span>Student</span>
					<Select value={userUuid} onValueChange={setUserUuid}>
						<SelectTrigger className="h-11 w-full">
							<SelectValue placeholder="Select user" />
						</SelectTrigger>
						<SelectContent>
							{users.map((user) => (
								<SelectItem key={user.uuid} value={user.uuid}>
									{user.firstName} {user.lastName} ({user.email})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{status === "saved" ? (
					<p className="text-sm font-semibold text-[var(--jade)] md:col-span-2">
						Community access granted.
					</p>
				) : null}
				{status === "error" ? (
					<p className="text-sm font-semibold text-[var(--sumac)] md:col-span-2">
						{error}
					</p>
				) : null}

				<Button type="submit" disabled={status === "saving" || !userUuid}>
					{status === "saving" ? "Saving..." : "Grant access"}
				</Button>
			</form>
		</section>
	);
}
