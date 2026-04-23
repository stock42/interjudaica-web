import type { Metadata } from "next";
import {
  AdminShell,
  ButtonLink,
  DataTable,
} from "@/app/components/portal-ui";
import { courses, formatUsd } from "@/app/lib/content";

export const metadata: Metadata = {
  title: "Admin Courses",
  description: "Manage InterJudaica courses and classes.",
};

export default function AdminCoursesPage() {
  return (
    <AdminShell
      title="Courses"
      description="Create and edit courses, prices, community discounts, images, editions, classes, and downloadable materials."
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Course catalog
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {courses.length} courses configured
            </p>
          </div>
          <ButtonLink href="#" tone="primary">
            New course
          </ButtonLink>
        </div>
        <DataTable
          columns={[
            "Course",
            "Level",
            "Price",
            "Community price",
            "Start",
            "Stripe link",
          ]}
          rows={courses.map((course) => [
            course.title,
            course.level,
            formatUsd(course.price),
            formatUsd(course.communityPrice),
            course.startDate,
            "Manual link",
          ])}
        />
      </div>
    </AdminShell>
  );
}
