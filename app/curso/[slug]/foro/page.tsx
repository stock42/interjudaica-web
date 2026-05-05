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

type CourseForumPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CourseForumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  return {
    title: course ? `${course.title} Forum` : "Course forum",
  };
}

export default async function CourseForumPage({ params }: CourseForumPageProps) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Course forum"
          title={`${course.title} discussion`}
          text="A single course thread keeps student questions, nested replies, and instructor moderation in one place."
          actions={
            <ButtonLink href={`/curso/${course.slug}/clases`} tone="secondary">
              Classes
            </ButtonLink>
          }
        />

        <article className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
          <div className="border-b border-[var(--line)] pb-5">
            <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
              Pinned thread
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              Questions from this week&apos;s class
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Rabbi Yattah: Please place source questions here and note the line
              number from the PDF when possible.
            </p>
          </div>

          <div className="mt-6 grid gap-5">
            {[
              {
                name: "Miriam S.",
                body: "In the second source, is the distinction about intention or about public responsibility?",
              },
              {
                name: "Rabbi Yattah",
                body: "Good question. Read it first as responsibility, then notice how intention becomes visible only through repeated action.",
              },
              {
                name: "David L.",
                body: "That helps. I am adding the parallel text from the sample packet.",
              },
            ].map((post, index) => (
              <div
                key={post.name}
                className={`rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 ${
                  index > 0 ? "ml-4 sm:ml-10" : ""
                }`}
              >
                <p className="text-sm font-bold">{post.name}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {post.body}
                </p>
              </div>
            ))}
          </div>

          <form className="mt-6 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Reply
              <textarea
                className="min-h-32 rounded-md border border-[var(--line)] bg-[var(--paper)] p-4 outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
                placeholder="Write a question or reply"
              />
            </label>
            <div>
              <ButtonLink href="#" tone="primary">
                Post reply
              </ButtonLink>
            </div>
          </form>
        </article>
      </Section>
    </PageShell>
  );
}
