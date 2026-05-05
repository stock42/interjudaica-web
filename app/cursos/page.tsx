import type { Metadata } from "next";

import {
  CourseGrid,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { listPublicCourses } from "@/app/lib/public-courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse InterJudaica courses in Jewish thought, Talmud, Hebrew text, and community learning.",
};

export default async function CoursesPage() {
  const courses = await listPublicCourses();

  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="All courses"
          title="Live and self-paced Jewish learning"
          text="Filter by price, level, and start date, then open a course page for editions, samples, pricing, and the private forum path."
        />

        <form className="mb-8 grid gap-3 rounded-lg border border-[var(--line)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold">
            Price
            <select className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3">
              <option>Any price</option>
              <option>Under $200 USD</option>
              <option>$200 USD and above</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Level
            <select className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3">
              <option>Any level</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Start date
            <select className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3">
              <option>All cohorts</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Search
            <input
              className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3"
              placeholder="Talmud, Hebrew, prayer"
              type="search"
            />
          </label>
        </form>

        <CourseGrid items={courses} />
      </Section>
    </PageShell>
  );
}
