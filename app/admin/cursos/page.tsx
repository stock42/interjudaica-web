import type { Metadata } from "next";
import { CourseList } from "@/app/admin/cursos/course-list";
import { AdminShell } from "@/app/components/portal-ui";
import { CourseStorage } from "@/services/courses-storage";

export const metadata: Metadata = {
  title: "Admin Courses",
  description: "Manage InterJudaica courses and classes.",
};

export const runtime = "nodejs";

export default async function AdminCoursesPage() {
  const courses = await CourseStorage.list();

  return (
    <AdminShell
      title="Courses"
      description="Search, review, edit, and publish the live course catalog."
    >
      <CourseList courses={courses} />
    </AdminShell>
  );
}
