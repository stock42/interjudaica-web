import type { Metadata } from "next";
import {
  AdminShell,
  AdminStatGrid,
  DataTable,
} from "@/app/components/portal-ui";
import { CourseCategoryStorage } from "@/services/course-categories-storage";
import { CourseStorage } from "@/services/courses-storage";
import { ForumStorage } from "@/services/forums-storage";
import { InstructorStorage } from "@/services/instructors-storage";
import { OperatorStorage } from "@/services/operators-storage";
import { PaperCategoryStorage } from "@/services/paper-categories-storage";
import { PaperStorage } from "@/services/papers-storage";
import { UserStorage } from "@/services/users-storage";

export const metadata: Metadata = {
  title: "Admin",
  description: "InterJudaica admin dashboard.",
};

export const runtime = "nodejs";

export default async function AdminPage() {
  const [
    categories,
    courses,
    forums,
    instructors,
    operators,
    paperCategories,
    papers,
    users,
  ] = await Promise.all([
    CourseCategoryStorage.list(),
    CourseStorage.list(),
    ForumStorage.list(),
    InstructorStorage.list(),
    OperatorStorage.list(),
    PaperCategoryStorage.list(),
    PaperStorage.list(),
    UserStorage.list(),
  ]);

  const publishedCourses = courses.filter(
    (course) => course.status === "published",
  );
  const publishedPapers = papers.filter((paper) => paper.status === "published");
  const openThreads = forums.filter((thread) => thread.status === "open");
  const activeUsers = users.filter((user) => user.status === "active");
  const enabledOperators = operators.filter((operator) => operator.enabled);

  return (
    <AdminShell
      title="Admin overview"
      description="Monitor catalog content, community writing, forum moderation, and student records."
    >
      <div className="grid gap-6">
        <AdminStatGrid
          stats={[
            {
              label: "Courses",
              value: String(courses.length),
              note: `${publishedCourses.length} published`,
            },
            {
              label: "Papers",
              value: String(papers.length),
              note: `${publishedPapers.length} published`,
            },
            {
              label: "Forum threads",
              value: String(forums.length),
              note: `${openThreads.length} open`,
            },
            {
              label: "Users",
              value: String(users.length),
              note: `${activeUsers.length} active`,
            },
            {
              label: "Operators",
              value: String(operators.length),
              note: `${enabledOperators.length} enabled`,
            },
          ]}
        />
        <DataTable
          columns={["Area", "Records", "Published/Open", "Admin path"]}
          rows={[
            [
              "Courses",
              String(courses.length),
              String(publishedCourses.length),
              "/admin/cursos",
            ],
            [
              "Course categories",
              String(categories.length),
              String(categories.filter((category) => category.enabled).length),
              "/admin/course-categories",
            ],
            [
              "Instructors",
              String(instructors.length),
              String(
                instructors.filter((instructor) => instructor.enabled).length,
              ),
              "/admin/instructors",
            ],
            [
              "Operators",
              String(operators.length),
              String(enabledOperators.length),
              "/admin/operators",
            ],
            [
              "Paper categories",
              String(paperCategories.length),
              String(
                paperCategories.filter((category) => category.enabled).length,
              ),
              "/admin/paper-categories",
            ],
            [
              "Papers",
              String(papers.length),
              String(publishedPapers.length),
              "/admin/papers",
            ],
            [
              "Forum",
              String(forums.length),
              String(openThreads.length),
              "/admin/foro",
            ],
            [
              "Users",
              String(users.length),
              String(activeUsers.length),
              "/admin/usuarios",
            ],
          ]}
        />
      </div>
    </AdminShell>
  );
}
