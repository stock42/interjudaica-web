"use client";

import Image from "next/image";
import { useState, useRef, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImageUploadField({
	label,
	uploadUrl,
	value,
	onChange,
}: {
	label: string;
	uploadUrl: string;
	value: string;
	onChange: (url: string) => void;
}) {
	const [preview, setPreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => setPreview(e.target?.result as string);
		reader.readAsDataURL(file);

		setUploading(true);
		setProgress(0);
		setError("");

		const xhr = new XMLHttpRequest();
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) {
				setProgress(Math.round((e.loaded / e.total) * 100));
			}
		};

		xhr.onload = () => {
			setUploading(false);
			if (xhr.status === 401) {
				window.location.assign(`/operator-login?next=${window.location.pathname}`);
				return;
			}
			try {
				const data = JSON.parse(xhr.responseText);
				if (xhr.status >= 200 && xhr.status < 300 && data.url) {
					onChange(data.url);
				} else {
					setError(data.error ?? "Upload failed");
				}
			} catch {
				setError("Upload failed");
			}
		};

		xhr.onerror = () => {
			setUploading(false);
			setError("Upload failed");
		};

		const formData = new FormData();
		formData.set("file", file);
		xhr.open("POST", uploadUrl);
		xhr.send(formData);

		if (inputRef.current) inputRef.current.value = "";
	}

	return (
		<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
			<Label>{label}</Label>
			<Input
				ref={inputRef}
				className="h-11"
				accept="image/png,image/jpeg,image/webp,image/gif"
				type="file"
				onChange={handleFileChange}
			/>
			{uploading ? (
				<div className="flex items-center gap-2">
					<div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
						<div
							className="h-full rounded-full bg-[var(--sapphire)] transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<span className="text-xs font-bold text-[var(--sapphire)]">
						{progress}%
					</span>
				</div>
			) : null}
			{error ? (
				<span className="text-xs font-bold text-red-600">{error}</span>
			) : null}
			{preview && !value ? (
				<div className="relative h-28 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
					<Image alt="Preview" className="object-cover" fill src={preview} sizes="320px" />
				</div>
			) : null}
			{value ? (
				<div className="relative h-28 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
					<Image alt="" className="object-cover" fill src={value} sizes="320px" />
				</div>
			) : null}
		</div>
	);
}
