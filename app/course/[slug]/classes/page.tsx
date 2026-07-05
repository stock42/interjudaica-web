import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { getPublicCourseBySlug } from "@/app/lib/public-courses";
import { CourseClassFileStorage } from "@/services/course-class-files-storage";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { getCurrentUser } from "@/services/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClassesPageProps = {
  params: Promise<{ slug: string }>;
};

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export async function generateMetadata({
  params,
}: ClassesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  return {
    title: course ? `${course.title} Classes` : "Course classes",
  };
}

export default async function CourseClassesPage({ params }: ClassesPageProps) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/course/${slug}/classes`);
  }

  const isEnrolled = await CourseEnrollmentStorage.isEnrolled(
    user.uuid,
    course.uuid ?? "",
  );
  if (!isEnrolled) {
    redirect(`/course/${slug}`);
  }

  const classes = await CourseClassStorage.listByCourse(course.uuid ?? "");
  const filesByClass = await Promise.all(
    classes.map(async (item) => ({
      classUuid: item.uuid ?? "",
      files: item.uuid ? await CourseClassFileStorage.listByClass(item.uuid) : [],
    })),
  );
  const fileLookup = new Map(
    filesByClass.map((item) => [item.classUuid, item.files]),
  );

  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Purchased course"
          title={course.title}
          text="Class recordings, audio, downloadable materials, and the class forum are organized by module."
          actions={
            <ButtonLink href={`/course/${course.slug}/forum`} tone="secondary">
              Course forum
            </ButtonLink>
          }
        />

        {classes.length ? (
          <div className="grid gap-5">
            {classes.map((item) => {
              const files = fileLookup.get(item.uuid ?? "") ?? [];

              return (
                <article
                  key={item.uuid}
                  className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
                        Class {item.order + 1}
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-semibold">
                        {item.title}
                      </h2>
                      {item.description ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-md border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-[var(--gold)]">
                      {files.length} material{files.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {files.length ? (
                      files.map((file) => (
                        <div
                          key={file.uuid}
                          className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 md:grid-cols-[1fr_auto] md:items-center"
                        >
                          <div>
                            <h3 className="text-base font-semibold text-[var(--ink)]">
                              {file.title || file.originalName}
                            </h3>
                            {file.description ? (
                              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                {file.description}
                              </p>
                            ) : null}
                            <p className="mt-2 text-xs text-[var(--muted)]">
                              {file.originalName} · {formatFileSize(file.size)}
                            </p>
                          </div>
                          <ButtonLink
                            href={`/api/courses/classes/files/${file.uuid}`}
                            tone="secondary"
                          >
                            Download
                          </ButtonLink>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-6 text-[var(--muted)]">
                        No materials have been uploaded for this class yet.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm leading-6 text-[var(--muted)]">
            Classes will appear here once lessons are uploaded for this course.
          </div>
        )}
      </Section>
    </PageShell>
  );
}
