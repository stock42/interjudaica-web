"use client";

import { Download, FileText, Save, Trash2 } from "lucide-react";

import { adminTextControlClass } from "@/app/admin/components/admin-controls";
import {
	type ClassFileDraft,
	formatFileSize,
} from "@/app/admin/classes/class-file-manager-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TypeCourseClassFile } from "@/models/course-class-files";

type ClassFileCardProps = {
	classUuid: string;
	file: TypeCourseClassFile;
	draft: ClassFileDraft;
	saving: boolean;
	deleting: boolean;
	onDraftChange: (field: keyof ClassFileDraft, value: string) => void;
	onSave: () => void;
	onDelete: () => void;
};

export function ClassFileCard({
	classUuid,
	file,
	draft,
	saving,
	deleting,
	onDraftChange,
	onSave,
	onDelete,
}: ClassFileCardProps) {
	const fileUuid = file.uuid ?? "";

	return (
		<article className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex min-w-0 gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--line)] text-[var(--gold)]">
						<FileText className="h-4 w-4" />
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-[var(--ink)]">
							{file.originalName}
						</p>
						<p className="mt-1 text-xs text-[var(--muted)]">
							{formatFileSize(file.size)} ·{" "}
							{file.mimeType || "application/octet-stream"}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline" size="sm">
						<a href={`/api/admin/classes/${classUuid}/files/${fileUuid}`}>
							<Download className="h-4 w-4" />
							Download
						</a>
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						disabled={deleting}
						onClick={onDelete}
					>
						<Trash2 className="h-4 w-4" />
						{deleting ? "Removing" : "Remove"}
					</Button>
				</div>
			</div>

			<div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Title
					<Input
						className={adminTextControlClass}
						value={draft.title}
						onChange={(event) => onDraftChange("title", event.target.value)}
					/>
				</label>
				<label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
					Description
					<Textarea
						className={adminTextControlClass}
						rows={2}
						value={draft.description}
						onChange={(event) =>
							onDraftChange("description", event.target.value)
						}
					/>
				</label>
				<Button type="button" variant="outline" disabled={saving} onClick={onSave}>
					<Save className="h-4 w-4" />
					{saving ? "Saving" : "Save"}
				</Button>
			</div>
		</article>
	);
}
