"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

type Status = "idle" | "sending" | "error";

export function VerifyEmailForm() {
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState("");
	const [code, setCode] = useState("");
	const initialEmail = searchParams.get("email") ?? "";
	const [email, setEmail] = useState(initialEmail);

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

			<Button type="submit" disabled={status === "sending" || code.length !== 6}>
				{status === "sending" ? "Verifying…" : "Verify email"}
			</Button>
		</form>
	);
}
