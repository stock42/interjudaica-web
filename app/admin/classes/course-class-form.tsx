"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClassFileManager } from "@/app/admin/classes/class-file-manager";
import type { TypeCourse } from "@/models/courses";
import type { TypeCourseClass } from "@/models/course-classes";

type CourseClassFormState = {
	title: string;
	description: string;
	imageUrl: string;
	order: string;
};

function createFormState(item?: TypeCourseClass): CourseClassFormState {
	return {
		title: item?.title ?? "",
		description: item?.description ?? "",
		imageUrl: item?.imageUrl ?? "",
		order: String(item?.order ?? 0),
	};
}

export function CourseClassForm({
	course,
	courseClass,
}: {
	course: TypeCourse;
	courseClass?: TypeCourseClass;
}) {
	const router = useRouter();
	const [form, setForm] = useState(() => createFormState(courseClass));
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const isEditing = Boolean(courseClass?.uuid);

	function setField(name: keyof CourseClassFormState, value: string) {
		setForm((current) => ({ ...current, [name]: value }));
	}

	async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		setUploading(true);
		setError("");

		const formData = new FormData();
		formData.set("file", file);

		const response = await fetch("/api/admin/uploads/class-image", {
			method: "POST",
			body: formData,
		});

		setUploading(false);
		event.target.value = "";

		if (response.status === 401) {
			window.location.assign(`/operator-login?next=/admin/classes/${course.uuid}`);
			return;
		}

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			setError(data.error ?? "The image could not be uploaded.");
			return;
		}

		setField("imageUrl", data.url);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError("");

		const response = await fetch(
			isEditing
				? `/api/admin/classes/${courseClass?.uuid}`
				: "/api/admin/classes",
			{
				method: isEditing ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					courseUuid: course.uuid,
					title: form.title,
					description: form.description,
					imageUrl: form.imageUrl,
					order: Number(form.order || 0),
				}),
			},
		);

		setLoading(false);

		if (response.status === 401) {
			window.location.assign(`/operator-login?next=/admin/classes/${course.uuid}`);
			return;
		}

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			setError(data.error ?? "The class could not be saved.");
			return;
		}

		const data = await response.json().catch(() => ({}));

		if (!isEditing) {
			router.push(`/admin/classes/${course.uuid}/edit/${data.item?.uuid}`);
			router.refresh();
			return;
		}

		router.push(`/admin/classes/${course.uuid}`);
		router.refresh();
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-display text-2xl font-semibold">
						{isEditing ? "Edit class" : "New class"}
					</h2>
					<p className="mt-1 text-sm text-[var(--muted)]">
						Classes are only visible to enrolled students.
					</p>
				</div>
				<Link
					href={`/admin/classes/${course.uuid}`}
					className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--paper)]"
				>
					Back to list
				</Link>
			</div>

			<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					Title
					<Input
						value={form.title}
						onChange={(event) => setField("title", event.target.value)}
						required
					/>
				</label>
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					Description
					<Textarea
						value={form.description}
						onChange={(event) => setField("description", event.target.value)}
						rows={4}
					/>
				</label>
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Order
					<Input
						type="number"
						min={0}
						value={form.order}
						onChange={(event) => setField("order", event.target.value)}
					/>
				</label>
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Label
					<Input value={course.title} disabled />
				</div>
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)] md:col-span-2">
					<Label>Optional image</Label>
					<div className="flex flex-wrap items-center gap-3">
						<Input type="file" accept="image/*" onChange={uploadImage} />
						{uploading ? (
							<span className="text-xs text-[var(--muted)]">Uploading…</span>
						) : null}
					</div>
					{form.imageUrl ? (
						<p className="text-xs text-[var(--muted)]">{form.imageUrl}</p>
					) : null}
				</div>

				{isEditing ? (
					<div className="md:col-span-2">
						<ClassFileManager
							courseUuid={course.uuid ?? ""}
							classUuid={courseClass?.uuid ?? ""}
						/>
					</div>
				) : (
					<p className="text-xs text-[var(--muted)] md:col-span-2">
						Save the class before uploading files.
					</p>
				)}

				{error ? (
					<p className="text-sm font-semibold text-red-600 md:col-span-2">
						{error}
					</p>
				) : null}

				<div className="flex flex-wrap gap-3 md:col-span-2">
					<Button type="submit" size="lg" disabled={loading}>
						{loading ? "Saving" : "Save class"}
					</Button>
					<Link
						href={`/admin/classes/${course.uuid}`}
						className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold transition hover:bg-[var(--paper)]"
					>
						Cancel
					</Link>
				</div>
			</form>
		</section>
	);
}
