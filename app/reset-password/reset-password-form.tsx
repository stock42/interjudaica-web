"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COOLDOWN_FALLBACK = Number(
	process.env.NEXT_PUBLIC_RESET_RESEND_COOLDOWN_SECONDS ?? "30",
);

type Status = "idle" | "sending" | "sent" | "error";

type ResendState = {
	cooldown: number;
	remaining: number;
	status: "idle" | "sending";
};

export default function ResetPasswordForm() {
	const searchParams = useSearchParams();
	const email = useMemo(
		() => (searchParams.get("email") ?? "").toLowerCase(),
		[searchParams],
	);
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState<string>("");
	const [resend, setResend] = useState<ResendState>({
		cooldown: COOLDOWN_FALLBACK,
		remaining: 0,
		status: "idle",
	});

	useEffect(() => {
		if (resend.remaining <= 0) {
			return;
		}

		const timer = window.setInterval(() => {
			setResend((current) => ({
				...current,
				remaining: Math.max(0, current.remaining - 1),
			}));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [resend.remaining]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setStatus("sending");

		const form = event.currentTarget;
		const formData = new FormData(form);
		const code = String(formData.get("code") ?? "");
		const password = String(formData.get("password") ?? "");

		try {
			const response = await fetch("/api/user-auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code, password }),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error ?? "Unable to reset password.");
			}

			form.reset();
			setStatus("sent");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to reset password.");
			setStatus("error");
		}
	}

	async function resendCode() {
		if (!email || resend.remaining > 0) {
			return;
		}

		setResend((current) => ({ ...current, status: "sending" }));

		try {
			const response = await fetch("/api/user-auth/resend-reset", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (response.status === 429) {
				const data = await response.json().catch(() => ({}));
				const retryAfter = Number(data.retryAfter ?? resend.cooldown);
				setResend({
					cooldown: resend.cooldown,
					remaining: retryAfter,
					status: "idle",
				});
				return;
			}

			const data = await response.json().catch(() => ({}));
			const cooldown = Number(data.cooldown ?? resend.cooldown);
			setResend({ cooldown, remaining: cooldown, status: "idle" });
		} catch {
			setResend((current) => ({ ...current, status: "idle" }));
		}
	}

	if (status === "sent") {
		return (
			<div className="rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.06)] p-6">
				<p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--jade)]">
					Password updated
				</p>
				<h2 className="mt-3 font-display text-3xl font-semibold">
					You can sign in now
				</h2>
				<p className="mt-3 text-sm leading-6 text-[var(--muted)]">
					Your password was updated. Return to the login page.
				</p>
				<Button className="mt-5" asChild>
					<a href="/login">Go to login</a>
				</Button>
			</div>
		);
	}

	return (
		<form className="grid gap-5" onSubmit={handleSubmit}>
			<div className="grid gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					value={email}
					disabled
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="code">6-digit code</Label>
				<Input
					id="code"
					name="code"
					type="text"
					inputMode="numeric"
					pattern="\d{6}"
					maxLength={6}
					required
					autoComplete="one-time-code"
					placeholder="123456"
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="password">New password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autoComplete="new-password"
					required
					minLength={8}
				/>
			</div>

			{error ? (
				<p className="text-sm font-semibold text-[var(--sumac)]">{error}</p>
			) : null}

			<div className="flex flex-wrap items-center gap-3">
				<Button type="submit" disabled={status === "sending" || !email}>
					{status === "sending" ? "Saving…" : "Save password"}
				</Button>
				<button
					type="button"
					className="text-sm font-semibold text-[var(--sapphire)]"
					onClick={resendCode}
					disabled={resend.remaining > 0 || resend.status === "sending"}
				>
					{resend.remaining > 0
						? `Resend code (${resend.remaining}s)`
						: resend.status === "sending"
							? "Resending…"
							: "Resend code"}
				</button>
			</div>

			{status === "error" ? (
				<p className="text-sm font-semibold text-[var(--sumac)]">
					Unable to reset password.
				</p>
			) : null}

			{!email ? (
				<p className="text-xs text-[var(--muted)]">
					Please return to the reset request screen and enter your email.
				</p>
			) : null}
		</form>
	);
}
