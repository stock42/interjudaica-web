import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ButtonLink,
  CourseArtwork,
  InfoList,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { getPublicCourseBySlug } from "@/app/lib/public-courses";
import { listCourseClasses } from "@/app/lib/public-course-classes";
import { formatUsd } from "@/app/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    return { title: "Course not found" };
  }

  return {
    title: course.title,
    description: course.description,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const [course, classes] = await Promise.all([
    getPublicCourseBySlug(slug),
    listCourseClasses(slug),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <PageShell>
      <Section tone="transparent">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-bold uppercase text-[var(--sapphire)]">
              {course.category} / {course.level}
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
              {course.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              {course.description}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">
                  Normal price
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {formatUsd(course.price)}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">
                  Community price
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {formatUsd(course.communityPrice)}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">
                  Duration
                </p>
                <p className="mt-2 text-3xl font-bold">{course.duration}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/checkout/${course.uuid}`}>
                Buy course
              </ButtonLink>
              <ButtonLink href="/community" tone="secondary">
                Buy with Community discount
              </ButtonLink>
            </div>
          </div>
          <CourseArtwork course={course} />
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionIntro
              eyebrow="What is included"
              title="A complete learning track"
              text={`${course.video}, ${course.certificate}, and ${course.zoomLink}.`}
            />
            <InfoList items={course.includes} />
          </div>
          <div>
            <SectionIntro
              eyebrow="Outcomes"
              title="What students will be able to do"
            />
            <InfoList items={course.outcomes} />
          </div>
        </div>
      </Section>

      <Section tone="white">
        <SectionIntro
          eyebrow="Classes"
          title="Class sessions"
          text="Each class includes readings, recordings, and downloadable materials once you enroll."
        />
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          {classes.length ? (
            <ul className="grid gap-3 text-sm text-[var(--muted)]">
              {classes.map((item) => (
                <li key={item.uuid} className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-xs font-semibold text-[var(--ink)]">
                    {item.order + 1}
                  </span>
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Classes will appear here once lessons are uploaded for this course.
            </p>
          )}
        </div>
      </Section>
    </PageShell>
  );
}
