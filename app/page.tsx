import Image from "next/image";
import { ButtonLink, PageShell } from "@/app/components/portal-ui";
import {
  courses,
  formatUsd,
  testimonials,
} from "@/app/lib/content";
import { listPublicCourses } from "@/app/lib/public-courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HomeCourse = {
  slug: string;
  title: string;
  category: string;
  price: number;
  communityPrice: number;
  summary: string;
  imageLabel: string;
  duration: string;
  thumbnailImageUrl?: string;
  coverImageUrl?: string;
  accent: string;
};

async function getHomeCourses(): Promise<HomeCourse[]> {
  try {
    const publicCourses = (await listPublicCourses())
      .filter((course) => course.summary.trim())
      .slice(0, 2);

    return publicCourses.length >= 2 ? publicCourses : courses.slice(0, 2);
  } catch {
    return courses.slice(0, 2);
  }
}

function CourseFeatureCard({
  course,
  image,
}: {
  course: HomeCourse;
  image: string;
}) {
  return (
    <article className="grid overflow-hidden rounded-lg border border-[var(--line)] bg-[#080b0d] shadow-[0_24px_70px_rgba(0,0,0,0.34)] md:grid-cols-[46%_54%]">
      <div className="relative min-h-72 overflow-hidden md:min-h-full">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 320px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.38))]" />
        <div className="absolute left-7 top-7 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--gold)] bg-[#050608]/90">
          <Image
            src="/interjudaica-silueta-candel.png"
            alt=""
            width={1024}
            height={1024}
            className="h-12 w-12"
          />
        </div>
      </div>
      <div className="flex min-h-72 flex-col justify-center p-7 lg:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
          Course
        </p>
        <h3 className="mt-4 font-display text-4xl font-semibold leading-tight text-[var(--ink)]">
          {course.title}
        </h3>
        <span className="mt-3 h-px w-16 bg-[var(--gold)]" />
        <p className="mt-5 text-base leading-7 text-white/72">{course.summary}</p>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-white/58">
            <span className="font-semibold text-[var(--gold)]">
              {formatUsd(course.price)}
            </span>
            <span> / Community {formatUsd(course.communityPrice)}</span>
          </div>
          <ButtonLink href={`/curso/${course.slug}`} tone="secondary">
            More information
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="mb-9 flex items-center gap-5">
      <span className="h-px flex-1 bg-[var(--line)]" />
      <h2 className="text-center font-display text-xl font-semibold uppercase tracking-[0.3em] text-[var(--gold)] sm:text-2xl">
        {children}
      </h2>
      <span className="h-px flex-1 bg-[var(--line)]" />
    </div>
  );
}

export default async function Home() {
  const homeCourses = await getHomeCourses();
  const courseImages = [
    homeCourses[0]?.thumbnailImageUrl ||
      homeCourses[0]?.coverImageUrl ||
      "/genesis.jpg",
    homeCourses[1]?.thumbnailImageUrl ||
      homeCourses[1]?.coverImageUrl ||
      "/hero-image.png",
  ];

  return (
    <PageShell>
      <section className="relative isolate overflow-hidden border-b border-[var(--line)] bg-[#050608] text-[var(--ink)]">
        <Image
          src="/hero-image.png"
          alt=""
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050608_0%,rgba(5,6,8,0.98)_32%,rgba(5,6,8,0.45)_70%,rgba(5,6,8,0.82)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_44%,transparent_0_17rem,rgba(244,189,51,0.48)_17.1rem,transparent_17.25rem),radial-gradient(circle_at_55%_44%,transparent_0_22rem,rgba(244,189,51,0.26)_22.1rem,transparent_22.25rem)]" />
        <Image
          src="/interjudaica-silueta-candel.png"
          alt=""
          width={1024}
          height={1024}
          className="pointer-events-none absolute -right-28 top-24 hidden h-[28rem] w-[28rem] opacity-45 lg:block"
          priority
        />

        <div className="relative mx-auto grid min-h-[560px] w-full max-w-[1320px] items-center px-5 py-14 sm:px-8 lg:min-h-[590px] lg:px-10">
          <div className="max-w-2xl">
            <h1 className="font-display text-5xl font-semibold leading-[0.98] text-[var(--ink)] sm:text-6xl lg:text-7xl">
              Learn Judaism with depth,
              <br />
              <span className="text-[var(--gold)]">
                history and tradition
              </span>
            </h1>
            <div className="my-7 flex max-w-md items-center gap-4 text-[var(--gold)]">
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
            <p className="max-w-xl text-lg leading-8 text-white/82">
              Online Jewish courses and community learning led by Rabbi Ernesto
              Yattah, with live cohorts, forums, papers, and certificate paths.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <ButtonLink href="/cursos">View courses</ButtonLink>
              <ButtonLink href="#about-rabbi" tone="secondary">
                Meet Rabbi Yattah
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#080b0d] px-5 py-11 text-[var(--ink)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1320px]">
          <SectionTitle>Featured Courses</SectionTitle>
          <div className="grid gap-8 lg:grid-cols-2">
            {homeCourses.map((course, index) => (
              <CourseFeatureCard
                key={course.slug}
                course={course}
                image={courseImages[index] ?? "/hero-image.png"}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="about-rabbi"
        className="bg-[#080b0d] px-5 pb-10 pt-5 text-[var(--ink)] sm:px-8 lg:px-10"
      >
        <div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative mx-auto aspect-square w-full max-w-[410px]">
            <div className="absolute inset-0 rounded-full border border-[var(--gold)] opacity-65" />
            <div className="absolute inset-5 rounded-full border border-[rgba(244,189,51,0.42)]" />
            <div className="absolute inset-10 overflow-hidden rounded-full bg-[radial-gradient(circle_at_center,rgba(244,189,51,0.14),rgba(5,6,8,0.92))]">
              <Image
                src="/foto-ernesto-yattah-bg-transparent.png"
                alt="Rabbi Ernesto Yattah"
                width={1254}
                height={1254}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="absolute bottom-4 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--gold)] bg-[#050608] shadow-[0_12px_30px_rgba(0,0,0,0.42)]">
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
              About the instructor
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--ink)]">
              Rabbi Ernesto Yattah
            </h2>
            <div className="mt-5 grid gap-4 text-base leading-7 text-white/76">
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
            <div className="mt-7">
              <ButtonLink href="/cursos" tone="secondary">
                Learn more about the Rabbi
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#080b0d] px-5 py-10 text-[var(--ink)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1160px]">
          <SectionTitle>Why Choose InterJudaica?</SectionTitle>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              ["Online classes", "Learn live or at your own pace from home."],
              ["Deep learning", "Clear, rigorous content rooted in authentic sources."],
              ["Cultural and spiritual focus", "Connect history, Torah, and daily life."],
              ["Access from anywhere", "Courses and community wherever you are."],
            ].map(([title, text]) => (
              <article
                key={title}
                className="border-r border-[var(--line)] px-5 text-center last:border-r-0"
              >
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--gold)]">
                  <Image
                    src="/interjudaica-silueta-candel.png"
                    alt=""
                    width={1024}
                    height={1024}
                    className="h-12 w-12"
                  />
                </div>
                <h3 className="font-display text-2xl font-semibold leading-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080b0d] px-5 py-10 text-[var(--ink)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1320px]">
          <SectionTitle>What Our Students Say</SectionTitle>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="rounded-lg border border-[var(--line)] bg-[#080b0d] p-7"
              >
                <p className="font-display text-4xl leading-none text-[var(--gold)]">
                  &quot;
                </p>
                <blockquote className="mt-1 text-base italic leading-7 text-white/84">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-6 text-sm text-white/75">
                  - {testimonial.name}
                </figcaption>
                <p className="mt-3 text-[var(--gold)]" aria-label="Five star review">
                  5.0 / 5
                </p>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#080b0d] px-5 pb-8 text-[var(--ink)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1320px] overflow-hidden rounded-lg border border-[var(--line)] bg-[linear-gradient(90deg,rgba(244,189,51,0.14),rgba(244,189,51,0.03))] p-8">
          <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <Image
              src="/interjudaica-silueta-candel.png"
              alt=""
              width={1024}
              height={1024}
              className="hidden h-24 w-24 md:block"
            />
            <h2 className="font-display text-4xl font-semibold leading-tight">
              Join InterJudaica and begin your next course today.
            </h2>
            <ButtonLink href="/register">Enroll now</ButtonLink>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
