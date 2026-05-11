"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TypeSafeUser } from "@/models/users";
import type { TypeCourse } from "@/models/courses";

export function EnrollmentForm({
	users,
	courses,
}: {
	users: TypeSafeUser[];
	courses: TypeCourse[];
}) {
	const [userUuid, setUserUuid] = useState("");
	const [courseUuid, setCourseUuid] = useState("");
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
		"idle",
	);
	const [error, setError] = useState("");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus("saving");
		setError("");

		const response = await fetch("/api/admin/enrollments", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userUuid, courseUuid }),
		});

		if (response.status === 401) {
			window.location.assign("/operator-login?next=/admin/enrollments");
			return;
		}

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			setError(data.error ?? "Unable to create enrollment.");
			setStatus("error");
			return;
		}

		setStatus("saved");
	}

	return (
		<section className="rounded-lg border border-[var(--line)] bg-white p-5">
			<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
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
				<div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					<span>Course</span>
					<Select value={courseUuid} onValueChange={setCourseUuid}>
						<SelectTrigger className="h-11 w-full">
							<SelectValue placeholder="Select course" />
						</SelectTrigger>
						<SelectContent>
							{courses.map((course) => (
								<SelectItem key={course.uuid} value={course.uuid ?? ""}>
									{course.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{status === "saved" ? (
					<p className="text-sm font-semibold text-[var(--jade)] md:col-span-2">
						Enrollment created.
					</p>
				) : null}
				{status === "error" ? (
					<p className="text-sm font-semibold text-[var(--sumac)] md:col-span-2">
						{error}
					</p>
				) : null}

				<Button type="submit" disabled={status === "saving" || !userUuid || !courseUuid}>
					{status === "saving" ? "Saving..." : "Enroll student"}
				</Button>
			</form>
		</section>
	);
}
