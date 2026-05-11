import { NextResponse, type NextRequest } from "next/server";

import { CourseCategoryStorage } from "@/services/course-categories-storage";
import { CourseStorage } from "@/services/courses-storage";
import { ForumStorage } from "@/services/forums-storage";
import { InstructorStorage } from "@/services/instructors-storage";
import { OperatorStorage } from "@/services/operators-storage";
import { PaperCategoryStorage } from "@/services/paper-categories-storage";
import { PaperStorage } from "@/services/papers-storage";
import { UserStorage } from "@/services/users-storage";
import { requireAdminApi } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

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

	const publishedCourses = courses.filter((course) => course.status === "published");
	const publishedPapers = papers.filter((paper) => paper.status === "published");
	const openThreads = forums.filter((thread) => thread.status === "open");
	const activeUsers = users.filter((user) => user.status === "active");
	const enabledOperators = operators.filter((operator) => operator.enabled);

	return NextResponse.json({
		stats: [
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
		],
		tables: {
			courses: {
				count: courses.length,
				published: publishedCourses.length,
			},
			courseCategories: {
				count: categories.length,
				enabled: categories.filter((category) => category.enabled).length,
			},
			instructors: {
				count: instructors.length,
				enabled: instructors.filter((instructor) => instructor.enabled).length,
			},
			operators: {
				count: operators.length,
				enabled: enabledOperators.length,
			},
			paperCategories: {
				count: paperCategories.length,
				enabled: paperCategories.filter((category) => category.enabled).length,
			},
			papers: {
				count: papers.length,
				published: publishedPapers.length,
			},
			forums: {
				count: forums.length,
				open: openThreads.length,
			},
			users: {
				count: users.length,
				active: activeUsers.length,
			},
		},
	});
}
