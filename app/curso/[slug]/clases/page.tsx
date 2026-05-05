import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { courses, getCourse } from "@/app/lib/content";

type ClassesPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: ClassesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);

  return {
    title: course ? `${course.title} Classes` : "Course classes",
  };
}

export default async function CourseClassesPage({ params }: ClassesPageProps) {
  const { slug } = await params;
  const course = getCourse(slug);

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
            <ButtonLink href={`/curso/${course.slug}/foro`} tone="secondary">
              Course forum
            </ButtonLink>
          }
        />

        <div className="grid gap-4">
          {course.lessons.map((lesson, index) => (
            <article
              key={lesson.title}
              className="rounded-lg border border-[var(--line)] bg-white p-5"
            >
              <div className="grid gap-5 lg:grid-cols-[6rem_1fr_12rem] lg:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold)] font-display text-2xl font-semibold text-[#07090c]">
                  {index + 1}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
                    {lesson.duration}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">
                    {lesson.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Material: {lesson.material}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <ButtonLink href="#" tone="primary">
                    Watch
                  </ButtonLink>
                  <ButtonLink href="#" tone="secondary">
                    Download
                  </ButtonLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
