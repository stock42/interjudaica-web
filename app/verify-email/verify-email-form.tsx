"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

type Status = "idle" | "sending" | "error" | "resending" | "resent";

export function VerifyEmailForm() {
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState("");
	const [code, setCode] = useState("");
	const [cooldown, setCooldown] = useState(0);
	const initialEmail = searchParams.get("email") ?? "";
	const [email, setEmail] = useState(initialEmail);

	function startCooldown(seconds: number) {
		setCooldown(seconds);
		const tick = (remaining: number) => {
			if (remaining <= 0) {
				return;
			}
			setTimeout(() => {
				setCooldown(remaining - 1);
				tick(remaining - 1);
			}, 1000);
		};
		tick(seconds);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("sending");
		setError("");

		try {
			const response = await fetch("/api/user-auth/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code }),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error ?? "Unable to verify email.");
			}

			window.location.assign("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to verify email.");
			setStatus("error");
			setStatus("idle");
		}
	}

	const defaultCooldown = Number(
		process.env.NEXT_PUBLIC_VERIFY_RESEND_COOLDOWN_SECONDS ?? 30,
	);

	async function handleResend() {
		if (!email || cooldown > 0) {
			return;
		}

		setStatus("resending");
		setError("");

		try {
			const response = await fetch("/api/user-auth/resend-verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				const retrySeconds =
					Number(data.retryAfter) || Number(data.cooldownSeconds) || 0;
				if (retrySeconds > 0) {
					startCooldown(retrySeconds);
				}
				throw new Error(data.error ?? "Unable to resend code.");
			}

			setStatus("resent");
			const cooldownSeconds =
				Number(data.cooldownSeconds) || defaultCooldown || 30;
			startCooldown(cooldownSeconds);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to resend code.");
			setStatus("error");
		} finally {
			setTimeout(() => setStatus("idle"), 500);
		}
	}

	return (
		<form className="grid gap-5" onSubmit={handleSubmit}>
			<div className="grid gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					required
					value={email}
					onChange={(event) => setEmail(event.target.value)}
				/>
			</div>

			<div className="grid gap-2">
				<Label>6-digit code</Label>
				<InputOTP
					maxLength={6}
					value={code}
					onChange={setCode}
					containerClassName="justify-between"
					inputMode="numeric"
				>
					<InputOTPGroup>
						{Array.from({ length: 6 }).map((_, index) => (
							<InputOTPSlot key={index} index={index} />
						))}
					</InputOTPGroup>
				</InputOTP>
				<p className="text-xs text-[var(--muted)]">
					Codes expire after 20 minutes.
				</p>
			</div>

			{status === "error" ? (
				<p className="text-sm font-semibold text-[var(--sumac)]">
					{error}
				</p>
			) : null}
			{status === "resent" ? (
				<p className="text-sm font-semibold text-[var(--jade)]">
					We sent a new code to your inbox.
				</p>
			) : null}

			<div className="flex flex-wrap items-center gap-3">
				<Button
					type="submit"
					disabled={status === "sending" || code.length !== 6}
				>
					{status === "sending" ? "Verifying…" : "Verify email"}
				</Button>
				<button
					className="text-sm font-semibold text-[var(--sapphire)] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
					type="button"
					onClick={handleResend}
					disabled={status === "resending" || cooldown > 0}
				>
					{status === "resending"
						? "Resending…"
						: cooldown > 0
						? `Resend in ${cooldown}s`
						: "Resend code"}
				</button>
			</div>
		</form>
	);
}
