import Image from "next/image";
import { ButtonLink, PageShell } from "@/app/components/portal-ui";
import { listPublicCourses } from "@/app/lib/public-courses";
import { listSocialProof } from "@/app/lib/social-proof";
import type { TypePublicCourse } from "@/models/courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const homeFrame =
  "mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-24";
type HomeIconKind = "book" | "pin" | "screen" | "menorah" | "globe";


function HomeIcon({ kind, className = "" }: { kind: HomeIconKind; className?: string }) {
  if (kind === "pin") {
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M24 42s14-13.2 14-25a14 14 0 0 0-28 0c0 11.8 14 25 14 25Z" />
        <circle cx="24" cy="17" r="5" />
      </svg>
    );
  }

  if (kind === "screen") {
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <rect x="8" y="12" width="32" height="22" rx="2" />
        <path d="M18 40h12M24 34v6" />
      </svg>
    );
  }

  if (kind === "globe") {
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <circle cx="24" cy="24" r="17" />
        <path d="M7 24h34M24 7c5 5 7.5 10.6 7.5 17S29 36 24 41M24 7c-5 5-7.5 10.6-7.5 17S19 36 24 41" />
      </svg>
    );
  }

  if (kind === "book") {
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M8 12h12c3.3 0 6 2.7 6 6v22c0-3.3-2.7-6-6-6H8V12Z" />
        <path d="M40 12H28c-3.3 0-6 2.7-6 6v22c0-3.3 2.7-6 6-6h12V12Z" />
        <path d="M24 18v22" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M24 8v30" />
      <path d="M14 12v10a10 10 0 0 0 20 0V12" />
      <path d="M8 14v8a16 16 0 0 0 32 0v-8" />
      <path d="M18 38h12M15 42h18" />
      <path d="M8 10l2-4 2 4M14 8l2-4 2 4M22 6l2-4 2 4M30 8l2-4 2 4M36 10l2-4 2 4" />
    </svg>
  );
}

type FeaturedCourse = Pick<
  TypePublicCourse,
  "slug" | "title" | "summary" | "coverImageUrl" | "thumbnailImageUrl"
>

function CourseFeatureCard({
  course,
  icon,
}: {
  course: FeaturedCourse;
  icon: HomeIconKind;
}) {
  const image = course.coverImageUrl || course.thumbnailImageUrl || "/hero-image.png";
  return (
    <article className="grid overflow-hidden rounded-lg border border-[rgba(244,189,51,0.62)] bg-[linear-gradient(120deg,#11161a_0%,#070a0c_58%,#050608_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.42)] md:h-[21rem] md:grid-cols-[47%_53%]">
      <div className="relative min-h-[18rem] overflow-hidden md:min-h-0">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.3))]" />
        <div className="absolute left-6 top-6 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold)] bg-[#050608]/92 text-[var(--gold)] shadow-[0_16px_36px_rgba(0,0,0,0.4)]">
          <HomeIcon kind={icon} className="h-9 w-9" />
        </div>
      </div>
      <div className="flex min-h-[18rem] flex-col justify-center overflow-hidden p-6 lg:p-7 md:min-h-0">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
          Course
        </p>
        <h3 className="mt-3 font-display text-[1.75rem] font-semibold leading-tight text-[#f8f2e8] xl:text-[1.9rem]">
          {course.title}
        </h3>
        <span className="mt-3 h-px w-20 bg-[var(--gold)]" />
        <p className="mt-4 line-clamp-3 max-w-md text-sm leading-6 text-white/78">
          {course.summary || "Course details coming soon."}
        </p>
        <div className="mt-5">
          <ButtonLink href={`/curso/${course.slug}`} tone="secondary">
            More information <span aria-hidden="true">&gt;</span>
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

function SectionTitle({
  children,
  lineTone = "line",
}: {
  children: string;
  lineTone?: "line" | "gold";
}) {
  const lineClass = lineTone === "gold" ? "bg-[var(--gold)]" : "bg-[var(--line)]";

  return (
    <div className="mb-7 flex items-center justify-center gap-6">
      <span className={`hidden h-px max-w-[18rem] flex-1 sm:block ${lineClass}`} />
      <h2 className="text-center font-display text-2xl font-semibold uppercase tracking-[0.32em] text-[var(--gold)]">
        {children}
      </h2>
      <span className={`hidden h-px max-w-[18rem] flex-1 sm:block ${lineClass}`} />
    </div>
  );
}

export default async function Home() {
  const [homeCourses, testimonials] = await Promise.all([
    listPublicCourses(),
    listSocialProof(),
  ]);
  const whyChoose = [
    {
      icon: "screen" as const,
      title: "Online classes",
      text: "Learn live or at your own pace from home.",
    },
    {
      icon: "book" as const,
      title: "Deep learning",
      text: "Clear, rigorous content rooted in authentic sources.",
    },
    {
      icon: "menorah" as const,
      title: "Cultural and spiritual focus",
      text: "Connect history, Torah, and daily life.",
    },
    {
      icon: "globe" as const,
      title: "Access from anywhere",
      text: "Courses and community wherever you are.",
    },
  ];

  return (
    <PageShell>
      <section className="relative isolate overflow-hidden border-b border-[var(--gold)] bg-[#050608] text-[#f8f2e8]">
        <Image
          src="/hero-image.png"
          alt=""
          fill
          sizes="100vw"
          className="absolute right-0 top-0 h-full w-full object-cover object-[78%_center]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050608_0%,#050608_32%,rgba(5,6,8,0.78)_52%,rgba(5,6,8,0.28)_72%,rgba(5,6,8,0.74)_100%)]" />
        <div className="absolute right-[-10rem] top-1/2 hidden h-[32rem] w-[32rem] -translate-y-1/2 rounded-full border border-[rgba(244,189,51,0.65)] opacity-75 lg:block" />
        <div className="absolute right-[-16rem] top-1/2 hidden h-[44rem] w-[44rem] -translate-y-1/2 rounded-full border border-[rgba(244,189,51,0.35)] opacity-70 lg:block" />
        <Image
          src="/logo-interjudaica-transparente.png"
          alt=""
          width={1500}
          height={1500}
          className="pointer-events-none absolute right-[-4rem] top-1/2 hidden h-[26rem] w-[26rem] -translate-y-1/2 opacity-40 lg:block"
          priority
        />

        <div className={`${homeFrame} relative grid min-h-[560px] items-center py-12`}>
          <div className="max-w-[42rem]">
            <h1 className="font-display text-5xl font-semibold leading-[0.98] text-[#f8f2e8] sm:text-6xl xl:text-7xl">
              Learn Judaism
              <br />
              with depth,
              <br />
              <span className="text-[var(--gold)]">history and tradition</span>
            </h1>
            <div className="my-8 flex max-w-[34rem] items-center gap-4 text-[var(--gold)]">
              <span className="h-px flex-1 bg-[var(--gold)]" />
              <HomeIcon kind="menorah" className="h-8 w-8" />
              <span className="h-px flex-1 bg-[var(--gold)]" />
            </div>
            <p className="max-w-[34rem] text-xl leading-9 text-white/86">
              Online Jewish courses and community learning led by Rabbi Ernesto
              Yattah.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <ButtonLink href="/cursos">
                View courses <span aria-hidden="true">&gt;</span>
              </ButtonLink>
              <ButtonLink href="#about-rabbi" tone="secondary">
                Meet Rabbi Yattah
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#080b0d] py-8 text-[#f8f2e8]">
        <div className={homeFrame}>
          <SectionTitle>Featured Courses</SectionTitle>
          {homeCourses.length === 0 ? (
            <div className="rounded-lg border border-[rgba(244,189,51,0.4)] bg-[#050608] p-6 text-sm text-white/70">
              No public courses are available yet.
            </div>
          ) : (
            <div className="-mx-6 overflow-x-auto px-6 pb-2">
              <div className="flex snap-x snap-mandatory gap-6">
                {homeCourses.map((course, index) => (
                  <div
                    key={course.slug}
                    className="w-[22rem] snap-start sm:w-[26rem] lg:w-[30rem]"
                  >
                    <CourseFeatureCard
                      course={course}
                      icon={index % 2 === 0 ? "book" : "pin"}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        id="about-rabbi"
        className="bg-[#080b0d] py-6 text-[#f8f2e8]"
      >
        <div
          className={`${homeFrame} grid gap-12 lg:grid-cols-[38%_1fr] lg:items-center`}
        >
          <div className="relative mx-auto aspect-square w-full max-w-[26rem] lg:mx-0 lg:ml-auto">
            <div className="absolute inset-0 rounded-full border border-[rgba(244,189,51,0.82)]" />
            <div className="absolute inset-4 rounded-full border border-[rgba(244,189,51,0.42)]" />
            <div className="absolute inset-9 overflow-hidden rounded-full bg-[radial-gradient(circle_at_center,rgba(244,189,51,0.22),rgba(244,189,51,0.06)_52%,rgba(5,6,8,0.92))]">
              <Image
                src="/foto-ernesto-yattah-bg-transparent.png"
                alt="Rabbi Ernesto Yattah"
                width={1254}
                height={1254}
                className="h-full w-full object-cover object-top"
                priority
              />
            </div>
            <div className="absolute bottom-3 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--gold)] bg-[#050608] shadow-[0_12px_30px_rgba(0,0,0,0.42)]">
              <HomeIcon kind="menorah" className="h-11 w-11" />
            </div>
          </div>

          <div className="max-w-[44rem]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
              About the instructor
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-[#f8f2e8] xl:text-5xl">
              Rabbi Ernesto Yattah
            </h2>
            <div className="mt-5 grid gap-3 text-base leading-7 text-white/78 xl:text-lg xl:leading-8">
              <p>Teacher, guide, and passionate advocate for serious Jewish learning.</p>
              <p>
                Rabbi Yattah brings years of study and teaching experience into
                a clear, warm, and rigorous learning environment.
              </p>
              <p>
                His classes connect Torah, Jewish history, culture, and daily
                life so students can study with confidence and carry the ideas
                into practice.
              </p>
            </div>
            <div className="mt-6">
              <ButtonLink href="/cursos" tone="secondary">
                Learn more about the Rabbi <span aria-hidden="true">&gt;</span>
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#080b0d] py-7 text-[#f8f2e8]">
        <div className={homeFrame}>
          <SectionTitle lineTone="gold">Why Choose InterJudaica?</SectionTitle>
          <div className="grid gap-8 md:grid-cols-4">
            {whyChoose.map((item) => (
              <article
                key={item.title}
                className="px-6 text-center md:border-r md:border-[rgba(244,189,51,0.55)] md:last:border-r-0"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold)] text-[var(--gold)]">
                  <HomeIcon kind={item.icon} className="h-10 w-10" />
                </div>
                <h3 className="font-display text-2xl font-semibold leading-tight text-[#f8f2e8]">
                  {item.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/72">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080b0d] py-7 text-[#f8f2e8]">
        <div className={homeFrame}>
          <SectionTitle>What Our Students Say</SectionTitle>
          <div className="grid gap-7 md:grid-cols-3">
            {testimonials.length === 0 ? (
              <p className="text-sm text-white/70">
                No testimonials have been published yet.
              </p>
            ) : (
              testimonials.map((testimonial) => (
                <figure
                  key={testimonial.name}
                  className="rounded-lg border border-[rgba(244,189,51,0.58)] bg-[#080b0d] p-6"
                >
                  <p className="font-display text-4xl leading-none text-[var(--gold)]">
                    &quot;
                  </p>
                  <blockquote className="mt-1 text-base italic leading-7 text-white/86">
                    {testimonial.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center justify-between gap-4 text-sm text-white/78">
                    <div>
                      <p>- {testimonial.name}</p>
                      <p className="text-xs text-white/60">
                        {testimonial.detail}
                      </p>
                    </div>
                    <span className="text-base tracking-[0.18em] text-[var(--gold)]">*****</span>
                  </figcaption>
                </figure>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#080b0d] pb-8 pt-2 text-[#f8f2e8]">
        <div className={homeFrame}>
          <div className="relative overflow-hidden rounded-lg border border-[rgba(244,189,51,0.62)] bg-[linear-gradient(90deg,rgba(244,189,51,0.16),rgba(244,189,51,0.04))] p-8">
            <Image
              src="/interjudaica-silueta-candel.png"
              alt=""
              width={1024}
              height={1024}
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 opacity-[0.08]"
            />
            <div className="relative grid gap-7 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--gold)] text-[var(--gold)]">
                <HomeIcon kind="menorah" className="h-16 w-16" />
              </div>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[#f8f2e8] lg:text-5xl">
                Join InterJudaica and begin your next course today.
              </h2>
              <ButtonLink href="/register">
                Enroll now <span aria-hidden="true">&gt;</span>
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
