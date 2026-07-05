import type { Metadata } from "next";
import {
  AdminShell,
  AdminStatGrid,
  DataTable,
} from "@/app/components/portal-ui";
import { AdminOverviewPanels } from "@/app/admin/admin-overview-panels";
import { CourseCategoryStorage } from "@/services/course-categories-storage";
import { CourseStorage } from "@/services/courses-storage";
import { ForumStorage } from "@/services/forums-storage";
import { InstructorStorage } from "@/services/instructors-storage";
import { OperatorStorage } from "@/services/operators-storage";
import { PaperCategoryStorage } from "@/services/paper-categories-storage";
import { PaperStorage } from "@/services/papers-storage";
import { PageStorage } from "@/services/pages-storage";
import { UserStorage } from "@/services/users-storage";
import { AdminSearchBar } from "@/app/admin/components/admin-search-bar";

export const metadata: Metadata = {
  title: "Admin",
  description: "InterJudaica admin dashboard.",
};

export const runtime = "nodejs";

function percent(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

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
    cmsPages,
  ] = await Promise.all([
    CourseCategoryStorage.list(),
    CourseStorage.list(),
    ForumStorage.list(),
    InstructorStorage.list(),
    OperatorStorage.list(),
    PaperCategoryStorage.list(),
    PaperStorage.list(),
    UserStorage.list(),
    PageStorage.list(),
  ]);

  const publishedCourses = courses.filter(
    (course) => course.status === "published",
  );
  const publishedPapers = papers.filter((paper) => paper.status === "published");
  const publishedPages = cmsPages.filter((page) => page.status === "published");
  const openThreads = forums.filter((thread) => thread.status === "open");
  const activeUsers = users.filter((user) => user.status === "active");
  const enabledOperators = operators.filter((operator) => operator.enabled);
  const signals = [
    {
      label: "Published courses",
      value: percent(publishedCourses.length, courses.length),
      detail: `${publishedCourses.length} of ${courses.length} courses`,
    },
    {
      label: "Published papers",
      value: percent(publishedPapers.length, papers.length),
      detail: `${publishedPapers.length} of ${papers.length} papers`,
    },
    {
      label: "Active students",
      value: percent(activeUsers.length, users.length),
      detail: `${activeUsers.length} of ${users.length} users`,
    },
    {
      label: "Published pages",
      value: percent(publishedPages.length, cmsPages.length),
      detail: `${publishedPages.length} of ${cmsPages.length} pages`,
    },
  ];
  const quickActions = [
    {
      href: "/admin/courses/new",
      title: "Create course",
      text: "Add a course and then attach classes, files, and forum access.",
    },
    {
      href: "/admin/enrollments",
      title: "Grant course access",
      text: "Manually enroll a student when payment or support requires it.",
    },
    {
      href: "/admin/contacts",
      title: "Review inquiries",
      text: "Reply to students and keep contact messages organized.",
    },
    {
      href: "/admin/config",
      title: "Tune settings",
      text: "Adjust upload limits, rate limits, sessions, and payment defaults.",
    },
  ];

  return (
    <AdminShell
      title="Admin overview"
      description="Monitor catalog content, community writing, forum moderation, and student records."
    >
      <div className="grid gap-6">
        <AdminSearchBar />
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
            {
              label: "CMS Pages",
              value: String(cmsPages.length),
              note: `${publishedPages.length} published`,
            },
          ]}
        />

        <AdminOverviewPanels signals={signals} quickActions={quickActions} />

        <DataTable
          columns={["Area", "Records", "Published/Open", "Admin path"]}
          rows={[
            [
              "Courses",
              String(courses.length),
              String(publishedCourses.length),
              "/admin/courses",
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
              "/admin/forum",
            ],
            [
              "Users",
              String(users.length),
              String(activeUsers.length),
              "/admin/users",
            ],
            [
              "CMS Pages",
              String(cmsPages.length),
              String(publishedPages.length),
              "/admin/pages",
            ],
            [
              "CRM Contacts",
              "—",
              "—",
              "/admin/crm/contacts",
            ],
            [
              "CRM Campaigns",
              "—",
              "—",
              "/admin/crm/campaigns",
            ],
            [
              "Email Templates",
              "—",
              "—",
              "/admin/email/templates",
            ],
          ]}
        />
      </div>
    </AdminShell>
  );
}
