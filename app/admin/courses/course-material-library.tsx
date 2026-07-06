import Link from 'next/link'
import { AlertTriangle, Download, FileText } from 'lucide-react'

import type { TypeCourse } from '@/models/courses'
import type { TypeCourseClass } from '@/models/course-classes'
import type { TypeCourseClassFile } from '@/models/course-class-files'

type CourseClassMaterials = {
	readonly courseClass: TypeCourseClass
	readonly files: TypeCourseClassFile[]
}

function formatFileSize(size: number): string {
	if (size < 1024) {
		return `${size} B`
	}

	if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(1)} KB`
	}

	return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function CourseMaterialLibrary({
	course,
	materials,
}: {
	course: TypeCourse
	materials: CourseClassMaterials[]
}) {
	const materialCount = materials.reduce((total, item) => total + item.files.length, 0)
	const emptyClassCount = materials.filter(item => item.files.length === 0).length
	const missingDescriptionCount = materials.reduce(
		(total, item) => total + item.files.filter(file => !file.description.trim()).length,
		0,
	)

	return (
		<section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:p-5">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gold)]">
						Course file library
					</p>
					<h2 className="mt-2 font-display text-2xl font-semibold text-[var(--ink)]">
						Materials across all classes
					</h2>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
						Review every downloadable file in this course, including missing descriptions
						and empty classes.
					</p>
				</div>
				<div className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-3 lg:min-w-96">
					<span className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
						<strong className="text-[var(--ink)]">{materials.length}</strong> classes
					</span>
					<span className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
						<strong className="text-[var(--ink)]">{materialCount}</strong> files
					</span>
					<span className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
						<strong className="text-[var(--ink)]">{missingDescriptionCount}</strong>{' '}
						without description
					</span>
				</div>
			</div>

			{emptyClassCount || missingDescriptionCount ?
				<div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[var(--gold)]">
					{emptyClassCount ?
						<span className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[rgba(244,189,51,0.08)] px-3 py-2">
							<AlertTriangle className="h-3.5 w-3.5" />
							{emptyClassCount} empty class{emptyClassCount === 1 ? '' : 'es'}
						</span>
					:	null}
					{missingDescriptionCount ?
						<span className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[rgba(244,189,51,0.08)] px-3 py-2">
							<AlertTriangle className="h-3.5 w-3.5" />
							{missingDescriptionCount} file
							{missingDescriptionCount === 1 ? '' : 's'} need descriptions
						</span>
					:	null}
				</div>
			:	null}

			<div className="mt-5 grid gap-3">
				{materials.length === 0 ?
					<div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper)] p-5">
						<p className="text-sm text-[var(--muted)]">This course has no classes yet.</p>
						<Link
							href={`/admin/classes/${course.uuid}/new`}
							className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--line)] px-4 text-sm font-semibold text-[var(--gold)] transition hover:bg-[rgba(244,189,51,0.1)]"
						>
							Create first class
						</Link>
					</div>
				:	materials.map(({ courseClass, files }) => (
						<article
							key={courseClass.uuid}
							className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4"
						>
							<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
								<div>
									<h3 className="text-base font-semibold text-[var(--ink)]">
										{courseClass.title}
									</h3>
									<p className="mt-1 text-xs text-[var(--muted)]">
										Order {courseClass.order ?? 0} · {files.length} material
										{files.length === 1 ? '' : 's'}
									</p>
								</div>
								<Link
									href={`/admin/classes/${course.uuid}/edit/${courseClass.uuid}`}
									className="inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--line)] px-3 text-xs font-bold text-[var(--gold)] transition hover:bg-[rgba(244,189,51,0.1)]"
								>
									Edit class
								</Link>
							</div>

							<div className="mt-4 grid gap-2">
								{files.length ?
									files.map(file => (
										<div
											key={file.uuid}
											className="grid gap-3 rounded-md border border-[var(--line-soft)] bg-[var(--surface-soft)] p-3 md:grid-cols-[1fr_auto] md:items-center"
										>
											<div className="flex min-w-0 gap-3">
												<FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
												<div className="min-w-0">
													<p className="truncate text-sm font-semibold text-[var(--ink)]">
														{file.title || file.originalName}
													</p>
													<p className="mt-1 text-xs text-[var(--muted)]">
														{file.originalName} · {formatFileSize(file.size)}
													</p>
													{file.description ?
														<p className="mt-2 text-xs leading-5 text-[var(--muted)]">
															{file.description}
														</p>
													:	<p className="mt-2 text-xs font-semibold text-[var(--gold)]">
															Missing student-facing description
														</p>
													}
												</div>
											</div>
											<a
												href={`/api/admin/classes/${courseClass.uuid}/files/${file.uuid}`}
												className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[var(--line)] px-3 text-xs font-bold text-[var(--gold)] transition hover:bg-[rgba(244,189,51,0.1)]"
											>
												<Download className="h-3.5 w-3.5" />
												Download
											</a>
										</div>
									))
								:	<p className="rounded-md border border-dashed border-[var(--line)] p-3 text-sm text-[var(--muted)]">
										No materials uploaded for this class.
									</p>
								}
							</div>
						</article>
					))
				}
			</div>
		</section>
	)
}
