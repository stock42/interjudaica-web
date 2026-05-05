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
import { communityBenefits, courses, testimonials } from "@/app/lib/content";
import { listPublicCourses } from "@/app/lib/public-courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getHomeCourses() {
  try {
    const publicCourses = (await listPublicCourses())
      .filter((course) => course.summary.trim())
      .slice(0, 3);

    return publicCourses.length ? publicCourses : courses.slice(0, 3);
  } catch {
    return courses.slice(0, 3);
  }
}

export default async function Home() {
  const homeCourses = await getHomeCourses();

  return (
    <PageShell>
      <section className="relative isolate overflow-hidden border-b border-[var(--line)] bg-[#050608] text-[var(--ink)]">
        <Image
          src="/hero-image.png"
          alt=""
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover object-center opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050608_0%,rgba(5,6,8,0.94)_34%,rgba(5,6,8,0.58)_64%,rgba(5,6,8,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_32%,transparent_0_16rem,rgba(244,189,51,0.42)_16.1rem,transparent_16.25rem),radial-gradient(circle_at_58%_32%,transparent_0_20rem,rgba(244,189,51,0.24)_20.1rem,transparent_20.25rem)]" />
        <Image
          src="/interjudaica-silueta-candel.png"
          alt=""
          width={1024}
          height={1024}
          className="pointer-events-none absolute -right-36 top-20 hidden h-[28rem] w-[28rem] opacity-35 md:block"
          priority
        />

        <div className="relative mx-auto grid min-h-[78svh] w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex border-l-2 border-[var(--gold)] pl-4 text-xs font-bold uppercase tracking-[0.22em] text-[var(--gold)]">
              Jewish courses, community, and certificates
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[0.95] text-[var(--ink)] sm:text-6xl lg:text-7xl">
              Learn Judaism with depth, history, and tradition
            </h1>
            <div className="my-7 flex max-w-sm items-center gap-4 text-[var(--gold)]">
              <span className="h-px flex-1 bg-[var(--gold)]" />
              <Image
                src="/interjudaica-silueta-candel.png"
                alt=""
                width={1024}
                height={1024}
                className="h-8 w-8"
              />
              <span className="h-px flex-1 bg-[var(--gold)]" />
            </div>
            <p className="max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
              Structured Jewish learning in English for students in the United
              States, with live courses from Rabbi Ernesto Yattah, private
              discussion forums, community papers, and certificate paths.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/cursos">Explore courses</ButtonLink>
              <ButtonLink href="#about-rabbi" tone="secondary">
                Meet the Rabbi
              </ButtonLink>
            </div>
          </div>

          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>

      <Section tone="paper" className="border-b border-[var(--line)]">
        <div className="mb-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[var(--line)]" />
          <h2 className="text-center font-display text-xl font-semibold uppercase tracking-[0.28em] text-[var(--gold)] sm:text-2xl">
            Featured Courses
          </h2>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <CourseGrid items={homeCourses} />
      </Section>

      <Section
        id="about-rabbi"
        tone="transparent"
        className="border-b border-[var(--line)]"
      >
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute inset-0 rounded-full border border-[var(--gold)]" />
            <div className="absolute inset-6 rounded-full border border-[rgba(244,189,51,0.42)]" />
            <div className="absolute inset-9 overflow-hidden rounded-full bg-[radial-gradient(circle_at_center,rgba(244,189,51,0.14),rgba(5,6,8,0.86))]">
              <Image
                src="/foto-ernesto-yattah-bg-transparent.png"
                alt="Rabbi Ernesto Yattah"
                width={1254}
                height={1254}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="absolute bottom-3 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--gold)] bg-[#050608] shadow-[0_12px_30px_rgba(0,0,0,0.42)]">
              <Image
                src="/interjudaica-silueta-candel.png"
                alt=""
                width={1024}
                height={1024}
                className="h-11 w-11"
              />
            </div>
          </div>

          <div>
            <SectionIntro
              eyebrow="About the instructor"
              title="Rabbi Ernesto Yattah"
              text="Teacher, guide, and passionate advocate for serious Jewish learning."
            />
            <div className="grid gap-4 text-base leading-7 text-[var(--muted)]">
              <p>
                Rabbi Yattah brings years of study and teaching experience into
                a clear, warm, and rigorous learning environment.
              </p>
              <p>
                His classes connect Torah, Jewish history, culture, and daily
                life so students can study with confidence and carry the ideas
                into practice.
              </p>
              <p>
                InterJudaica was built to give every student a direct path from
                live courses to community discussion, papers, replays, and
                certificates.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/cursos">View courses</ButtonLink>
              <ButtonLink href="/comunidad" tone="secondary">
                Join for $19 USD/month
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="paper" className="border-b border-[var(--line)]">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionIntro
              eyebrow="Community"
              title="$19 USD/month for ongoing study"
              text="The InterJudaica community gives students a durable place to keep learning after a course ends, with papers, member discussions, and discounts."
            />
            <ButtonLink href="/comunidad">Subscribe</ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {communityBenefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <p className="text-sm leading-6 text-[var(--muted)]">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="transparent" className="border-b border-[var(--line)]">
        <SectionIntro
          eyebrow="Why choose InterJudaica?"
          title="A complete portal for study that keeps going"
          text="Students can move from discovery to enrollment, class access, community discussion, certificates, and account management without leaving the portal."
        />
        <div className="grid gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
          {[
            ["Live and self-paced", "Study online from home with live cohorts and replay access."],
            ["Deep learning", "Clear, rigorous content rooted in authentic Jewish sources."],
            ["Community forum", "Private discussions keep questions moving between classes."],
            ["Certificates", "Structured paths help students complete and document their learning."],
          ].map(([title, text]) => (
            <article
              key={title}
              className="bg-[var(--surface)] p-6 text-center md:min-h-52"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--gold)]">
                <Image
                  src="/interjudaica-silueta-candel.png"
                  alt=""
                  width={1024}
                  height={1024}
                  className="h-9 w-9"
                />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <MetricsBand />
        </div>
      </Section>

      <Section tone="ink">
        <div className="mb-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[var(--line)]" />
          <h2 className="text-center font-display text-xl font-semibold uppercase tracking-[0.28em] text-[var(--gold)] sm:text-2xl">
            What Our Students Say
          </h2>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <p className="font-display text-4xl leading-none text-[var(--gold)]">
                &quot;
              </p>
              <blockquote className="mt-1 text-base italic leading-7 text-white/82">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="block font-semibold text-[var(--ink)]">
                  {testimonial.name}
                </span>
                <span className="text-white/55">{testimonial.detail}</span>
              </figcaption>
              <p className="mt-4 text-[var(--gold)]" aria-label="Five star review">
                5.0 / 5
              </p>
            </figure>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-[var(--line)] bg-[linear-gradient(90deg,rgba(244,189,51,0.12),rgba(244,189,51,0.03))] p-5 sm:p-7">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-center gap-5">
              <Image
                src="/interjudaica-silueta-candel.png"
                alt=""
                width={1024}
                height={1024}
                className="hidden h-20 w-20 sm:block"
              />
              <h2 className="font-display text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
                Join InterJudaica and begin your next course today.
              </h2>
            </div>
            <ButtonLink href="/register">Create account</ButtonLink>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[var(--gold)] underline decoration-[var(--gold)]/40 underline-offset-4 transition hover:decoration-[var(--gold)]"
          >
            Preview the student dashboard
          </Link>
        </div>
      </Section>
    </PageShell>
  );
}
