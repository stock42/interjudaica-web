import Image from "next/image";
import Link from "next/link";
import {
  ButtonLink,
  CourseGrid,
  MetricsBand,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { communityBenefits, testimonials } from "@/app/lib/content";
import { listPublicCourses } from "@/app/lib/public-courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getHomeCourses() {
  try {
    return (await listPublicCourses()).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function Home() {
  const homeCourses = await getHomeCourses();

  return (
    <PageShell>
      <section className="relative isolate overflow-hidden border-b border-[var(--line)] bg-[var(--ink)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(22,74,159,0.8),transparent_42%),repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_28px)]" />
        <Image
          src="/logo-interjudaica.png"
          alt=""
          width={500}
          height={500}
          className="absolute -right-20 top-12 h-64 w-64 rounded-full opacity-20 sm:right-8 sm:h-80 sm:w-80 lg:h-[28rem] lg:w-[28rem]"
          priority
        />
        <div className="relative mx-auto flex min-h-[74svh] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:min-h-[72svh] sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase text-white/80">
              Jewish courses, community, and certificates
            </p>
            <h1 className="font-display text-5xl font-semibold leading-none sm:text-6xl lg:text-7xl">
              InterJudaica
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
              Structured Jewish learning in English for students in the United
              States, with live courses from Rabbi Yattah, private discussion
              forums, community papers, and certificate paths.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/cursos" tone="dark">
                Explore courses
              </ButtonLink>
              <ButtonLink
                href="/comunidad"
                tone="quiet"
                className="text-white hover:bg-white/10"
              >
                Join for $19 USD/month
              </ButtonLink>
            </div>
          </div>

          <div className="mt-12 grid max-w-4xl gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15 sm:grid-cols-3">
            {[
              ["Live cohorts", "May, July, and September 2026"],
              ["Member pricing", "Course discounts for subscribers"],
              ["Private forums", "Course and community discussions"],
            ].map(([title, text]) => (
              <div key={title} className="bg-black/20 p-4 backdrop-blur">
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section tone="paper">
        <SectionIntro
          eyebrow="Featured courses"
          title="Cohorts designed for serious, accessible study"
          text="Each course includes live Zoom sessions, replay access, downloadable source material, and a private forum for questions between classes."
          actions={
            <ButtonLink href="/cursos" tone="secondary">
              Browse all
            </ButtonLink>
          }
        />
        <CourseGrid items={homeCourses} />
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionIntro
              eyebrow="Community"
              title="$19 USD/month for ongoing study"
              text="The InterJudaica community gives students a durable place to keep learning after a course ends, with papers, member discussions, and discounts."
            />
            <ButtonLink href="/comunidad">Subscribe</ButtonLink>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {communityBenefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5"
              >
                <p className="text-sm leading-6 text-[var(--muted)]">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <SectionIntro
          eyebrow="Portal modules"
          title="A student portal with the backoffice already mapped"
          text="Students can move from discovery to enrollment, class access, community discussion, certificates, and account management without leaving the portal."
        />
        <MetricsBand />
      </Section>

      <Section tone="ink">
        <SectionIntro
          eyebrow="Student voices"
          title="Built for study that continues after class"
          text="Students can follow a course, revisit recordings, download materials, and continue the conversation in the forum from any screen size."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="rounded-lg border border-white/15 bg-white/10 p-5"
            >
              <blockquote className="text-base leading-7 text-white/80">
                &quot;{testimonial.quote}&quot;
              </blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="block font-semibold text-white">
                  {testimonial.name}
                </span>
                <span className="text-white/60">{testimonial.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
          >
            Preview the student dashboard
          </Link>
        </div>
      </Section>
    </PageShell>
  );
}
