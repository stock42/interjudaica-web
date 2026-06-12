import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/services/user-auth";
import { getCurrentOperator } from "@/services/auth";
import StudentUserMenu from "@/components/share/student-user-menu";
import OperatorUserMenu from "@/components/share/operator-user-menu";
import {
	contactInfo,
	navItems,
} from "@/app/lib/content";
import { PageStorage } from "@/services/pages-storage";
import { MoreContentMenu } from "@/app/components/more-content-menu";
import {
	ButtonLink,
	Eyebrow,
	Section,
} from "@/app/components/portal-ui-client";
import AdminNav from "@/app/admin/components/admin-nav";

export {
	ButtonLink,
	Eyebrow,
	Section,
	SectionIntro,
	CourseCard,
	CourseArtwork,
	CourseGrid,
	InfoList,
	type CourseCardItem,
	type ButtonTone,
} from "@/app/components/portal-ui-client";


export async function SiteHeader() {
  const [operator, user, publishedPages] = await Promise.all([
    getCurrentOperator(),
    getCurrentUser(),
    PageStorage.listPublished(),
  ]);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--gold)] bg-black shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-5 px-6 py-4 sm:px-10 lg:px-16 xl:px-20 2xl:px-24">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="InterJudaica home"
        >
          <Image
            src="/logo-interjudaica.png"
            alt="InterJudaica logo"
            width={1500}
            height={1500}
            className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full border border-[rgba(244,189,51,0.32)]"
            priority
          />
          <span className="grid min-w-0 leading-none">
            <span className="font-display text-3xl font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
              InterJudaica
            </span>
            <span className="mt-1 hidden text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[var(--gold)] sm:block">
              Jewish Learning Institute
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="order-3 -mx-4 flex w-[calc(100%+2rem)] gap-4 overflow-x-auto px-4 pb-1 sm:order-none sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 lg:gap-8"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 border-b-2 border-transparent px-1 py-2 text-base font-medium text-[rgba(248,242,232,0.9)] transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              {item.label}
            </Link>
          ))}
          <MoreContentMenu pages={publishedPages} />
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {operator ? (
            <OperatorUserMenu
              firstName={operator.firstName ?? ""}
              lastName={operator.lastName ?? ""}
              email={operator.email}
            />
          ) : user ? (
            <StudentUserMenu
              firstName={user.firstName}
              lastName={user.lastName}
              email={user.email}
            />
          ) : (
            <>
              <ButtonLink href="/login" tone="secondary" className="min-w-28">
                Login
              </ButtonLink>
              <ButtonLink href="/register" className="min-w-36">
                Enroll
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const publishedPages = await PageStorage.listPublished();
  const footerNavLinks = [
    { href: "/", label: "Home" },
    { href: "/courses", label: "Courses" },
    { href: "/#about-ernesto", label: "About Ernesto" },
    { href: "/#contact", label: "Contact" },
    ...publishedPages.map((page) => ({
      href: `/page/${page.slug}`,
      label: page.title,
    })),
  ];
  return (
    <footer
      id="contact"
      className="relative isolate overflow-hidden border-t border-[var(--line)] bg-[#050608] text-[var(--ink)]"
    >
      <Image
        src="/interjudaica-silueta-candel.png"
        alt=""
        width={1024}
        height={1024}
        className="pointer-events-none absolute -right-32 -top-28 h-80 w-80 opacity-[0.08]"
      />
      <div className="relative mx-auto grid w-full gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.15fr_0.65fr_1.35fr_0.7fr] lg:px-16 xl:px-20 2xl:px-24">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo-interjudaica.png"
              alt="InterJudaica logo"
              width={1500}
              height={1500}
              className="h-14 w-14 rounded-full border border-[rgba(244,189,51,0.32)]"
            />
            <span className="grid">
              <span className="font-display text-2xl font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                InterJudaica
              </span>
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
                Jewish Learning Institute
              </span>
            </span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Serious Jewish learning for students across the United States,
            built around live courses, community study, and accessible source
            material.
          </p>
        </div>

        <FooterColumn
          title="Navigation"
          links={footerNavLinks}
        />

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Contact
          </h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-white/70">
            <Link
              href={contactInfo.whatsappHref}
              className="transition hover:text-[var(--gold)]"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp: {contactInfo.whatsapp}
            </Link>
            <Link
              href={`mailto:${contactInfo.email}`}
              className="transition hover:text-[var(--gold)]"
            >
              Email: {contactInfo.email}
            </Link>
            <div>
              <p className="font-semibold text-[var(--gold)]">Office Hours</p>
              <div className="mt-1 grid gap-1">
                {contactInfo.officeHours.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Follow us
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {["F", "I", "Y", "W"].map((label) => (
              <Link
                key={label}
                href={label === "W" ? contactInfo.whatsappHref : "#"}
                target={label === "W" ? "_blank" : undefined}
                rel={label === "W" ? "noreferrer" : undefined}
                aria-label={label === "W" ? "WhatsApp" : `Social link ${label}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gold)] text-sm font-bold text-[var(--gold)] transition hover:bg-[var(--gold)] hover:text-[#07090c]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="relative mx-auto flex w-full flex-col gap-3 border-t border-[var(--line)] px-6 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16 xl:px-20 2xl:px-24">
        <p>Copyright 2026 InterJudaica. All rights reserved.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="#" className="transition hover:text-[var(--gold)]">
            Terms and conditions
          </Link>
          <Link href="#" className="transition hover:text-[var(--gold)]">
            Privacy
          </Link>
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
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-white/65 transition hover:text-[var(--gold)]"
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

export function MetricsBand() {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["3", "live cohorts open"],
        ["$19", "monthly community"],
        ["100%", "mobile ready portal"],
        ["1", "forum per course"],
      ].map(([value, label]) => (
        <div key={label} className="bg-[var(--surface)] p-5">
          <p className="font-display text-3xl font-semibold text-[var(--gold)]">
            {value}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
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
          <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
            {text}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[linear-gradient(145deg,rgba(23,28,32,0.96),rgba(9,11,13,0.96))] p-5 shadow-[var(--shadow)] sm:p-8">
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
        className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--paper)] px-4 text-base font-normal outline-none transition focus:border-[var(--gold)] focus:ring-4 focus:ring-[rgba(244,189,51,0.16)]"
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
  return (
    <PageShell>
      <Section tone="transparent">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-[var(--line)] bg-[linear-gradient(180deg,rgba(23,28,32,0.98),rgba(8,10,12,0.98))] p-3 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
                  Admin
                </p>
                <form action="/api/auth/logout" method="post">
                  <button
                    className="rounded-md border border-[var(--line)] px-2.5 py-1 text-xs font-bold text-[var(--muted)] transition hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)]"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              </div>
              <AdminNav />
            </div>
          </aside>
          <div className="min-w-0">
            <div className="mb-8">
              <Eyebrow>Backoffice</Eyebrow>
              <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
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
  stats = [],
}: {
  stats?: { label: string; value: string; note: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
        >
          <p className="text-sm font-semibold text-[var(--muted)]">
            {stat.label}
          </p>
          <p className="mt-3 font-display text-4xl font-semibold text-[var(--gold)]">
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
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead className="bg-[rgba(244,189,51,0.08)] text-xs uppercase tracking-[0.12em] text-[var(--gold)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-bold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={`${rowIndex}-${row.join("-")}`}
                className="border-t border-[var(--line)] hover:bg-[rgba(244,189,51,0.05)]"
              >
                {row.map((cell, index) => (
                  <td key={`${index}-${cell}`} className="px-4 py-4 text-[var(--muted)]">
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
