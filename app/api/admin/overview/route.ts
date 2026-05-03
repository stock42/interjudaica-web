import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/app/api/_lib/admin-api";
import { CourseCategoryStorage } from "@/services/course-categories-storage";
import { CourseStorage } from "@/services/courses-storage";
import { ForumStorage } from "@/services/forums-storage";
import { InstructorStorage } from "@/services/instructors-storage";
import { PaperStorage } from "@/services/papers-storage";
import { UserStorage } from "@/services/users-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const [categories, courses, forums, instructors, papers, users] =
    await Promise.all([
      CourseCategoryStorage.list(),
    CourseStorage.list(),
    ForumStorage.list(),
      InstructorStorage.list(),
      PaperStorage.list(),
      UserStorage.list(),
    ]);

  return NextResponse.json({
    stats: [
      { label: "Courses", value: String(courses.length), note: "catalog records" },
      {
        label: "Course categories",
        value: String(categories.length),
        note: "taxonomy records",
      },
      {
        label: "Instructors",
        value: String(instructors.length),
        note: "teaching team records",
      },
      { label: "Papers", value: String(papers.length), note: "library records" },
      { label: "Forum threads", value: String(forums.length), note: "moderation queue" },
      { label: "Users", value: String(users.length), note: "student records" },
    ],
  });
}
