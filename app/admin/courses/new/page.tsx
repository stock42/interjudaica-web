import type { Metadata } from "next";
import { CourseForm } from "@/app/admin/courses/course-form";
import AiCourseCreateButton from "@/app/admin/courses/ai-course-create-button";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseCategoryStorage } from "@/services/course-categories-storage";
import { InstructorStorage } from "@/services/instructors-storage";

export const metadata: Metadata = {
  title: "New Course",
  description: "Create a new InterJudaica course.",
};

export const runtime = "nodejs";

export default async function NewCoursePage() {
  const [categories, instructors] = await Promise.all([
    CourseCategoryStorage.list(),
    InstructorStorage.list(),
  ]);

  return (
    <AdminShell
      title="New course"
      description="Create a course record for the public catalog and student portal."
    >
      <div className="mb-4">
        <AiCourseCreateButton />
      </div>
      <CourseForm categories={categories} instructors={instructors} />
    </AdminShell>
  );
}
