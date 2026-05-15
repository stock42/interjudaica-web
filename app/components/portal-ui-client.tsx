"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	type Course,
	formatUsd,
} from "@/app/lib/content";

// ── Types ────────────────────────────────────────────────────────────

export type ButtonTone = "primary" | "secondary" | "quiet" | "dark";

export type CourseCardItem = Pick<
	Course,
	| "slug"
	| "title"
	| "category"
	| "level"
	| "price"
	| "communityPrice"
	| "duration"
	| "imageLabel"
	| "thumbnailImageUrl"
	| "coverImageUrl"
	| "accent"
	| "summary"
>;

// ── ButtonLink ───────────────────────────────────────────────────────

const buttonTones: Record<ButtonTone, string> = {
	primary:
		"border-[var(--gold)] bg-[var(--gold)] text-[#07090c] shadow-[0_16px_34px_rgba(244,189,51,0.22)] hover:border-[#ffd66b] hover:bg-[#ffd66b]",
	secondary:
		"border-[var(--gold)] bg-transparent text-[var(--gold)] hover:bg-[rgba(244,189,51,0.12)] hover:text-[var(--ink)]",
	quiet:
		"border-transparent bg-transparent text-[var(--ink)] hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)]",
	dark: "border-[var(--gold)] bg-[var(--gold)] text-[#07090c] hover:bg-[#ffd66b]",
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
			className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold transition ${buttonTones[tone]} ${className}`}
			target={isExternal ? "_blank" : undefined}
			rel={isExternal ? "noreferrer" : undefined}
		>
			{children}
		</Link>
	);
}

// ── Section / Eyebrow / SectionIntro ─────────────────────────────────

export function Section({
	children,
	id,
	tone = "paper",
	className = "",
}: {
	children: ReactNode;
	id?: string;
	tone?: "paper" | "white" | "ink" | "transparent";
	className?: string;
}) {
	const tones = {
		paper: "bg-[var(--paper)] text-[var(--ink)]",
		white: "bg-[var(--surface)] text-[var(--ink)]",
		ink: "bg-[#050608] text-[var(--ink)]",
		transparent: "bg-transparent text-[var(--ink)]",
	};

	return (
		<section id={id} className={`relative ${tones[tone]} ${className}`}>
			<div className="mx-auto w-full max-w-[1320px] px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
				{children}
			</div>
		</section>
	);
}

export function Eyebrow({ children }: { children: ReactNode }) {
	return (
		<p className="mb-4 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--gold)]">
			<span className="h-px w-10 bg-[var(--gold)]" aria-hidden="true" />
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
				<h2 className="font-display text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
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

// ── CourseArtwork ────────────────────────────────────────────────────

export function CourseArtwork({
	course,
	compact = false,
}: {
	course: CourseCardItem;
	compact?: boolean;
}) {
	const style = {
		"--course-accent": course.accent,
	} as CSSProperties;
	const imageSrc = course.thumbnailImageUrl || course.coverImageUrl;

	return (
		<div
			className={`relative isolate overflow-hidden bg-[#050608] text-white ${
				compact ? "min-h-48" : "min-h-[22rem] rounded-lg"
			}`}
			style={style}
		>
			{imageSrc ? (
				<Image
					src={imageSrc}
					alt=""
					fill
					sizes={compact ? "(min-width: 1024px) 33vw, 100vw" : "100vw"}
					className="object-cover"
				/>
			) : null}
			<div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.22),rgba(0,0,0,0.78)_62%),radial-gradient(circle_at_18%_22%,var(--course-accent),transparent_17rem),repeating-linear-gradient(90deg,rgba(244,189,51,0.12)_0_1px,transparent_1px_24px)]" />
			<Image
				src="/interjudaica-silueta-candel.png"
				alt=""
				width={1024}
				height={1024}
				className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 opacity-20"
			/>
			<div className="absolute left-6 top-6 h-16 w-16 rounded-full border border-[rgba(244,189,51,0.5)] bg-black/45 backdrop-blur" />
			<div className="absolute bottom-0 right-0 h-36 w-36 translate-x-8 translate-y-8 rounded-full border border-[rgba(244,189,51,0.3)]" />
			<div className="relative flex h-full min-h-inherit flex-col justify-between p-6">
				<span className="w-fit rounded-md border border-[rgba(244,189,51,0.45)] bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
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

// ── CourseCard ───────────────────────────────────────────────────────

export function CourseCard({ course }: { course: CourseCardItem }) {
	return (
		<article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-[linear-gradient(145deg,rgba(23,28,32,0.98),rgba(8,10,12,0.98))] shadow-[var(--shadow)] transition hover:-translate-y-1 hover:border-[rgba(244,189,51,0.62)]">
			<CourseArtwork course={course} compact />
			<div className="flex flex-1 flex-col p-5 sm:p-6">
				<div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
					<span>{course.category}</span>
					<span aria-hidden="true">/</span>
					<span>{course.level}</span>
				</div>
				<h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-[var(--ink)]">
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
						<p className="text-2xl font-bold text-[var(--ink)]">
							{formatUsd(course.price)}
						</p>
						<p className="text-xs text-[var(--muted)]">
							Community: {formatUsd(course.communityPrice)}
						</p>
					</div>
					<ButtonLink href={`/course/${course.slug}`} tone="secondary">
						View course
					</ButtonLink>
				</div>
			</div>
		</article>
	);
}

// ── CourseGrid ───────────────────────────────────────────────────────

export function CourseGrid({ items }: { items: CourseCardItem[] }) {
	if (!items.length) {
		return (
			<div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 text-sm leading-6 text-[var(--muted)]">
				New public courses will appear here soon.
			</div>
		);
	}

	return (
		<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
			{items.map((course) => (
				<CourseCard key={course.slug} course={course} />
			))}
		</div>
	);
}

// ── InfoList ─────────────────────────────────────────────────────────

export function InfoList({ items }: { items: string[] }) {
	return (
		<div className="grid gap-3">
			{items.map((item) => (
				<div
					key={item}
					className="flex gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4"
				>
					<span
						aria-hidden="true"
						className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]"
					/>
					<p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
				</div>
			))}
		</div>
	);
}
