import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseForm } from "@/app/admin/cursos/course-form";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseCategoryStorage } from "@/services/course-categories-storage";
import { CourseStorage } from "@/services/courses-storage";
import { InstructorStorage } from "@/services/instructors-storage";

export const metadata: Metadata = {
  title: "Edit Course",
  description: "Edit an InterJudaica course.",
};

export const runtime = "nodejs";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const [course, categories, instructors] = await Promise.all([
    CourseStorage.get(uuid),
    CourseCategoryStorage.list(),
    InstructorStorage.list(),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit course"
      description="Update catalog details, pricing, visibility, and student-facing materials."
    >
      <CourseForm
        categories={categories}
        course={course}
        instructors={instructors}
      />
    </AdminShell>
  );
}
