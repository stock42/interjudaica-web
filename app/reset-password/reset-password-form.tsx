"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

const COOLDOWN_FALLBACK = Number(
	process.env.NEXT_PUBLIC_RESET_RESEND_COOLDOWN_SECONDS ?? "60",
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
	const shouldStartCooldown = searchParams.get("sent") === "1";
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState<string>("");
	const [code, setCode] = useState("");
	const [resendError, setResendError] = useState("");
	const [resendMessage, setResendMessage] = useState("");
	const [resend, setResend] = useState<ResendState>({
		cooldown: COOLDOWN_FALLBACK,
		remaining: email && shouldStartCooldown ? COOLDOWN_FALLBACK : 0,
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
		const password = String(formData.get("password") ?? "");
		const confirmPassword = String(formData.get("confirmPassword") ?? "");

		if (code.length !== 6) {
			setError("Enter the 6-digit code we emailed you.");
			setStatus("idle");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			setStatus("idle");
			return;
		}

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
			setCode("");
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

		setResendError("");
		setResendMessage("");
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
				setResendError(
					data.error === "Too many requests"
						? `Too many requests. Try again in ${retryAfter}s.`
						: `Please wait ${retryAfter}s before trying again.`,
				);
				return;
			}

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.error ?? "Unable to resend the code.");
			}

			const cooldown = Number(data.cooldownSeconds ?? data.cooldown ?? resend.cooldown);
			setResend({ cooldown, remaining: cooldown, status: "idle" });
			setResendMessage("We sent a new code to your inbox.");
		} catch (err) {
			setResend((current) => ({ ...current, status: "idle" }));
			setResendError(
				err instanceof Error ? err.message : "Unable to resend the code.",
			);
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
				<Label>6-digit code</Label>
				<InputOTP
					maxLength={6}
					value={code}
					onChange={(value) => setCode(value.replace(/\D/g, ""))}
					containerClassName="justify-between"
					inputMode="numeric"
					pattern="^[0-9]+$"
				>
					<InputOTPGroup>
						{Array.from({ length: 6 }).map((_, index) => (
							<InputOTPSlot
								key={index}
								index={index}
								className="size-10 text-base sm:size-11"
							/>
						))}
					</InputOTPGroup>
				</InputOTP>
				<p className="text-xs text-[var(--muted)]">
					Codes expire after 15 minutes.
				</p>
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

			<div className="grid gap-2">
				<Label htmlFor="confirmPassword">Confirm new password</Label>
				<Input
					id="confirmPassword"
					name="confirmPassword"
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
				<Button
					type="submit"
					disabled={status === "sending" || !email || code.length !== 6}
				>
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

			{resendError ? (
				<p className="text-sm font-semibold text-[var(--sumac)]">
					{resendError}
				</p>
			) : null}

			{resendMessage ? (
				<p className="text-sm font-semibold text-[var(--jade)]">
					{resendMessage}
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
