import type { Metadata } from "next";
import Link from "next/link";
import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { dashboardCourses, forumThreads } from "@/app/lib/content";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "InterJudaica student dashboard for courses and community.",
};

export default function DashboardPage() {
  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Student dashboard"
          title="Welcome back, Miriam"
          text="Continue purchased courses, manage the community membership, review live sessions, and jump back into forum threads."
        />

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-3xl font-semibold">
                My courses
              </h2>
              <ButtonLink href="/cursos" tone="secondary">
                Find a course
              </ButtonLink>
            </div>
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
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        Next live class: {course.startDate}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ButtonLink
                        href={`/curso/${course.slug}/clases`}
                        tone="primary"
                      >
                        Classes
                      </ButtonLink>
                      <ButtonLink
                        href={`/curso/${course.slug}/foro`}
                        tone="secondary"
                      >
                        Forum
                      </ButtonLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="grid gap-5">
            <section className="rounded-lg border border-[var(--line)] bg-[#050608] p-5 text-white sm:p-6">
              <p className="text-xs font-bold uppercase text-white/60">
                Community subscription
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                Active
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Renews on May 23, 2026 at $19 USD/month.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col">
                <ButtonLink href="/comunidad/foro" tone="dark">
                  Community forum
                </ButtonLink>
                <ButtonLink
                  href="/comunidad/papers"
                  tone="quiet"
                  className="text-white hover:bg-white/10"
                >
                  Papers
                </ButtonLink>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
              <h2 className="font-display text-3xl font-semibold">
                Forum activity
              </h2>
              <div className="mt-5 grid gap-3">
                {forumThreads.map((thread) => (
                  <Link
                    key={thread.title}
                    href="/comunidad/foro"
                    className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 transition hover:border-[var(--sapphire)]"
                  >
                    <span className="text-xs font-bold uppercase text-[var(--muted)]">
                      {thread.area}
                    </span>
                    <span className="mt-2 block text-sm font-semibold leading-6">
                      {thread.title}
                    </span>
                    <span className="mt-2 block text-xs text-[var(--sapphire)]">
                      {thread.unread} unread updates
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </Section>
    </PageShell>
  );
}
