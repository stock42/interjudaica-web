import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/app/api/_lib/admin-api";
import { CourseStorage } from "@/services/courses-storage";
import { ForumStorage } from "@/services/forums-storage";
import { PaperStorage } from "@/services/papers-storage";
import { UserStorage } from "@/services/users-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if ("response" in auth) {
    return auth.response;
  }

  const [courses, papers, forums, users] = await Promise.all([
    CourseStorage.list(),
    PaperStorage.list(),
    ForumStorage.list(),
    UserStorage.list(),
  ]);

  return NextResponse.json({
    stats: [
      { label: "Courses", value: String(courses.length), note: "catalog records" },
      { label: "Papers", value: String(papers.length), note: "library records" },
      { label: "Forum threads", value: String(forums.length), note: "moderation queue" },
      { label: "Users", value: String(users.length), note: "student records" },
    ],
  });
}

