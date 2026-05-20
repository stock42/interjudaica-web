import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { getPublicCourseBySlug } from "@/app/lib/public-courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClassesPageProps = {
  params: Promise<{ slug: string }>;
};

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

        <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm leading-6 text-[var(--muted)]">
          Classes will appear here once lessons are uploaded for this course.
        </div>
      </Section>
    </PageShell>
  );
}
