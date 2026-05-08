import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { getPublicCourseBySlug } from "@/app/lib/public-courses";
import { listForumThreads } from "@/app/lib/forums";
import { CourseThreadForm } from "@/app/curso/[slug]/foro/thread-form";
import { getCurrentUser } from "@/services/user-auth";
import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";

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

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/curso/${slug}/foro`);
  }

  const isEnrolled = await CourseEnrollmentStorage.isEnrolled(
    user.uuid,
    course.uuid ?? "",
  );
  if (!isEnrolled) {
    redirect(`/curso/${slug}`);
  }

  const threads = await listForumThreads({ area: "Course Forum", courseSlug: slug });

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

        <div className="grid gap-4">
          <CourseThreadForm courseSlug={slug} />
          {threads.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No threads yet.</p>
          ) : (
            threads.map((thread) => (
              <article
                key={thread.uuid}
                className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6"
              >
                <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
                  {thread.area}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  {thread.title}
                </h2>
                {thread.content ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {thread.content}
                  </p>
                ) : null}
                {thread.imageUrls?.length ? (
                  <div className="mt-4 grid gap-2">
                    {thread.imageUrls.map((url) => (
                      <Image
                        key={url}
                        src={url}
                        alt="Thread attachment"
                        width={960}
                        height={540}
                        className="max-w-full rounded-lg border border-[var(--line)]"
                      />
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </Section>
    </PageShell>
  );
}
