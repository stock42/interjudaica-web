import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  type Course,
  adminStats,
  courses,
  formatUsd,
  navItems,
} from "@/app/lib/content";

type ButtonTone = "primary" | "secondary" | "quiet" | "dark";

const buttonTones: Record<ButtonTone, string> = {
  primary:
    "border-[var(--ink)] bg-[var(--ink)] text-white hover:bg-[var(--sapphire)] hover:border-[var(--sapphire)]",
  secondary:
    "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--paper)]",
  quiet:
    "border-transparent bg-transparent text-[var(--ink)] hover:bg-white",
  dark: "border-white/20 bg-white text-[var(--ink)] hover:bg-[var(--gold)]",
};

export function ButtonLink({
  href,
  children,
  tone = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: ButtonTone;
  className?: string;
}) {
  const isExternal = href.startsWith("http");

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition ${buttonTones[tone]} ${className}`}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(255,253,247,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="InterJudaica home"
        >
          <Image
            src="/logo-interjudaica.png"
            alt="InterJudaica logo"
            width={500}
            height={500}
            className="h-11 w-11 shrink-0 rounded-full"
            priority
          />
          <span className="min-w-0 font-display text-xl font-semibold leading-none text-[var(--ink)]">
            InterJudaica
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="order-3 -mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 sm:order-none sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-white hover:text-[var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink href="/login" tone="quiet" className="hidden sm:inline-flex">
            Sign in
          </ButtonLink>
          <ButtonLink href="/register" tone="primary">
            Join
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ink)] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo-interjudaica.png"
              alt="InterJudaica logo"
              width={500}
              height={500}
              className="h-12 w-12 rounded-full border border-white/20"
            />
            <span className="font-display text-2xl font-semibold">
              InterJudaica
            </span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Serious Jewish learning for students across the United States,
            built around live courses, community study, and accessible source
            material.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <FooterColumn
            title="Learn"
            links={[
              { href: "/cursos", label: "All courses" },
              { href: "/comunidad", label: "Community" },
              { href: "/comunidad/papers", label: "Papers" },
            ]}
          />
          <FooterColumn
            title="Student"
            links={[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/login", label: "Sign in" },
              { href: "/register", label: "Create account" },
            ]}
          />
          <FooterColumn
            title="Office"
            links={[
              { href: "/admin", label: "Admin" },
              { href: "/admin/cursos", label: "Courses" },
              { href: "/admin/pagos", label: "Payments" },
            ]}
          />
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-white/65 transition hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="flex-1">{children}</main>;
}

export function Section({
  children,
  tone = "paper",
  className = "",
}: {
  children: ReactNode;
  tone?: "paper" | "white" | "ink" | "transparent";
  className?: string;
}) {
  const tones = {
    paper: "bg-[var(--paper)] text-[var(--ink)]",
    white: "bg-white text-[var(--ink)]",
    ink: "bg-[var(--ink)] text-white",
    transparent: "bg-transparent text-[var(--ink)]",
  };

  return (
    <section className={`${tones[tone]} ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 inline-flex rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-bold uppercase text-[var(--sapphire)]">
      {children}
    </p>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  text,
  actions,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h2>
        {text ? (
          <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">
            {text}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[0_18px_50px_rgba(17,19,21,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(17,19,21,0.12)]">
      <CourseArtwork course={course} compact />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
          <span>{course.category}</span>
          <span aria-hidden="true">/</span>
          <span>{course.level}</span>
        </div>
        <h3 className="mt-3 font-display text-2xl font-semibold leading-tight">
          {course.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-[var(--muted)]">
          {course.summary}
        </p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              From
            </p>
            <p className="text-2xl font-bold">{formatUsd(course.price)}</p>
            <p className="text-xs text-[var(--muted)]">
              Community: {formatUsd(course.communityPrice)}
            </p>
          </div>
          <ButtonLink href={`/curso/${course.slug}`} tone="secondary">
            View course
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export function CourseArtwork({
  course,
  compact = false,
}: {
  course: Course;
  compact?: boolean;
}) {
  const style = {
    "--course-accent": course.accent,
  } as CSSProperties;

  return (
    <div
      className={`relative isolate overflow-hidden bg-[var(--ink)] text-white ${
        compact ? "min-h-48" : "min-h-[22rem] rounded-lg"
      }`}
      style={style}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--course-accent),rgba(255,255,255,0)_48%),repeating-linear-gradient(90deg,rgba(255,255,255,0.12)_0_1px,transparent_1px_24px)]" />
      <div className="absolute left-6 top-6 h-16 w-16 rounded-full border border-white/30" />
      <div className="absolute bottom-0 right-0 h-36 w-36 translate-x-8 translate-y-8 rounded-full border border-white/20" />
      <div className="relative flex h-full min-h-inherit flex-col justify-between p-6">
        <span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase">
          {course.imageLabel}
        </span>
        <div className="mt-20 max-w-sm">
          <p className="text-sm text-white/70">{course.duration}</p>
          <p className="mt-2 font-display text-3xl font-semibold leading-tight">
            {course.category}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MetricsBand() {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["3", "live cohorts open"],
        ["$19", "monthly community"],
        ["100%", "mobile ready portal"],
        ["1", "forum per course"],
      ].map(([value, label]) => (
        <div key={label} className="bg-white p-5">
          <p className="font-display text-3xl font-semibold">{value}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
        </div>
      ))}
    </div>
  );
}

export function CourseGrid({ items = courses }: { items?: Course[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((course) => (
        <CourseCard key={course.slug} course={course} />
      ))}
    </div>
  );
}

export function InfoList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div
          key={item}
          className="flex gap-3 rounded-lg border border-[var(--line)] bg-white p-4"
        >
          <span
            aria-hidden="true"
            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--sapphire)]"
          />
          <p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
        </div>
      ))}
    </div>
  );
}

export function AuthPanel({
  title,
  text,
  eyebrow = "Student access",
  children,
}: {
  title: string;
  text: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <Section className="min-h-[calc(100vh-5rem)]" tone="transparent">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
            {text}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_18px_60px_rgba(17,19,21,0.08)] sm:p-8">
          {children}
        </div>
      </div>
    </Section>
  );
}

export function Field({
  label,
  type = "text",
  name,
  placeholder,
}: {
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
      {label}
      <input
        className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4 text-base font-normal outline-none transition focus:border-[var(--sapphire)] focus:ring-4 focus:ring-[rgba(19,70,160,0.14)]"
        type={type}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const adminLinks = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/usuarios", label: "Users" },
    { href: "/admin/cursos", label: "Courses" },
    { href: "/admin/course-categories", label: "Course categories" },
    { href: "/admin/instructors", label: "Instructors" },
    { href: "/admin/suscripciones", label: "Subscriptions" },
    { href: "/admin/pagos", label: "Payments" },
    { href: "/admin/papers", label: "Papers" },
    { href: "/admin/foro", label: "Forum" },
    { href: "/admin/analytics", label: "Analytics" },
  ];

  return (
    <PageShell>
      <Section tone="transparent">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-[var(--line)] bg-white p-3">
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <p className="text-xs font-bold uppercase text-[var(--muted)]">
                  Admin
                </p>
                <form action="/api/auth/logout" method="post">
                  <button
                    className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-bold text-[var(--muted)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              </div>
              <nav className="grid gap-1" aria-label="Admin navigation">
                {adminLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
          <div className="min-w-0">
            <div className="mb-8">
              <Eyebrow>Backoffice</Eyebrow>
              <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
                {description}
              </p>
            </div>
            {children}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

export function AdminStatGrid({
  stats = adminStats,
}: {
  stats?: { label: string; value: string; note: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-[var(--line)] bg-white p-5"
        >
          <p className="text-sm font-semibold text-[var(--muted)]">
            {stat.label}
          </p>
          <p className="mt-3 font-display text-4xl font-semibold">
            {stat.value}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">{stat.note}</p>
        </div>
      ))}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead className="bg-[var(--paper)] text-xs uppercase text-[var(--muted)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-bold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-t border-[var(--line)]">
                {row.map((cell) => (
                  <td key={cell} className="px-4 py-4 text-[var(--muted)]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
