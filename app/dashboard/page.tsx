import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { getCurrentUser } from "@/services/user-auth";
import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { CourseStorage } from "@/services/courses-storage";
import { BookSaleStorage } from "@/services/book-sales-storage";
import { EmailPreferencesToggle } from "@/app/dashboard/email-preferences-toggle";
import { listForumThreads } from "@/app/lib/forums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "InterJudaica student dashboard for courses and community.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; course?: string }>;
}) {
  const { payment } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const enrollments = await CourseEnrollmentStorage.listByUser(user.uuid);
  const courses = await Promise.all(
    enrollments.map((enrollment) => CourseStorage.get(enrollment.courseUuid)),
  );
  const dashboardCourses = courses.filter(
    (course): course is NonNullable<typeof course> => Boolean(course),
  );

  const myBooks = await BookSaleStorage.listByEmail(user.email);
  const paidBooks = myBooks.filter((sale) => sale.status === "paid");
  const forumResult = await listForumThreads({
    area: "Announcements",
    page: 1,
    limit: 3,
  });

  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Student dashboard"
          title="Welcome back"
          text="Continue purchased courses, manage the community membership, review live sessions, and jump back into forum threads."
        />

        {payment === "success" ? (
          <div className="rounded-lg border border-[var(--line)] bg-[rgba(244,189,51,0.12)] p-4 text-sm font-semibold text-[var(--ink)]">
            Payment received. Your course enrollment is being activated.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-3xl font-semibold">
                My courses
              </h2>
              <ButtonLink href="/courses" tone="secondary">
                Find a course
              </ButtonLink>
            </div>

            {dashboardCourses.length === 0 ? (
              <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
                No courses yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {dashboardCourses.map((course) => (
                  <article
                    key={course.slug}
                    className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
                          {course.category}
                        </p>
                        <h3 className="mt-2 font-display text-2xl font-semibold">
                          {course.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <ButtonLink
                          href={`/course/${course.slug}/clases`}
                          tone="primary"
                        >
                          Classes
                        </ButtonLink>
                        <ButtonLink
                          href={`/course/${course.slug}/foro`}
                          tone="secondary"
                        >
                          Forum
                        </ButtonLink>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {paidBooks.length > 0 ? (
            <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
              <h2 className="font-display text-3xl font-semibold">My books</h2>
              <div className="mt-5 grid gap-3">
                {paidBooks.map((sale) => (
                  <article
                    key={sale.uuid}
                    className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
                          Book
                        </p>
                        <h3 className="mt-1 font-semibold text-[var(--ink)]">
                          {sale.bookTitle}
                        </h3>
                      </div>
                      {sale.accessToken ? (
                        <Link
                          href={`/api/books/download?token=${sale.accessToken}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--sapphire)] px-4 text-sm font-semibold text-[var(--sapphire)] transition hover:bg-[var(--sapphire)] hover:text-white"
                        >
                          Download
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <aside className="grid gap-5">
            <section className="rounded-lg border border-[var(--line)] bg-[#050608] p-5 text-white sm:p-6">
              <p className="text-xs font-bold uppercase text-white/60">
                Community subscription
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                {user.communityStatus === "active" ? "Active" : "Not subscribed"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {user.communityStatus === "active"
                  ? "Renews at $19 USD/month."
                  : "Subscribe to unlock the community forum and papers."}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col">
                {user.communityStatus === "active" ? (
                  <ButtonLink href="/community/foro" tone="dark">
                    Community forum
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/checkout-community" tone="dark">
                    Subscribe
                  </ButtonLink>
                )}
                <ButtonLink
                  href="/community/papers"
                  tone="quiet"
                  className="text-white hover:bg-white/10"
                >
                  Papers
                </ButtonLink>
                <ButtonLink
                  href="/support"
                  tone="quiet"
                  className="text-white hover:bg-white/10"
                >
                  Technical support
                </ButtonLink>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
              <h2 className="font-display text-3xl font-semibold">
                Forum activity
              </h2>
              <div className="mt-5 grid gap-3">
                {forumResult.items.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    No announcements yet.
                  </p>
                ) : (
                  forumResult.items.map((thread) => (
                    <Link
                      key={thread.uuid}
                      href="/forum"
                      className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 transition hover:border-[var(--sapphire)]"
                    >
                      <span className="text-xs font-bold uppercase text-[var(--muted)]">
                        {thread.area}
                      </span>
                      <span className="mt-2 block text-sm font-semibold leading-6">
                        {thread.title}
                      </span>
                      <span className="mt-2 block text-xs text-[var(--sapphire)]">
                        {thread.unreadCount ?? 0} unread updates
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
              <h2 className="font-display text-3xl font-semibold">Preferences</h2>
              <EmailPreferencesToggle enabled={user.emailNotifications ?? true} />
            </section>
          </aside>
        </div>
      </Section>
    </PageShell>
  );
}
