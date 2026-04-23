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
import { courses, formatUsd, getCourse } from "@/app/lib/content";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return {
      title: "Course not found",
    };
  }

  return {
    title: course.title,
    description: course.description,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = getCourse(slug);

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
              <ButtonLink href={course.stripePaymentLink}>
                Buy course
              </ButtonLink>
              <ButtonLink href="/comunidad" tone="secondary">
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

      <Section tone="paper">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <SectionIntro
              eyebrow="Available editions"
              title="Choose a cohort or self-paced path"
            />
            <div className="grid gap-4">
              {course.editions.map((edition) => (
                <article
                  key={edition.name}
                  className="rounded-lg border border-[var(--line)] bg-white p-5"
                >
                  <h2 className="font-display text-2xl font-semibold">
                    {edition.name}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {edition.schedule}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[var(--sapphire)]">
                    {edition.seats}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <SectionIntro
              eyebrow="Sample materials"
              title="Preview the learning style"
            />
            <div className="grid gap-4">
              {course.sampleMaterials.map((sample) => (
                <div
                  key={sample.title}
                  className="rounded-lg border border-[var(--line)] bg-white p-5"
                >
                  <p className="text-xs font-bold uppercase text-[var(--muted)]">
                    {sample.kind}
                  </p>
                  <p className="mt-2 font-semibold">{sample.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
