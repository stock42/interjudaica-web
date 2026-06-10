import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { verifyCsrfToken, CSRF_COOKIE, CSRF_HEADER } from "@/services/csrf";
import { ForumStorage } from "@/services/forums-storage";
import { getCurrentUser } from "@/services/user-auth";
import { CourseStorage } from "@/services/courses-storage";
import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { readJson, routeError } from "@/app/api/_lib/admin-api";
import { sendForumReplyNotification } from "@/lib/send-forum-reply-notification";
import { getBaseUrl } from "@/lib/base-url";
import { hasActiveCommunityMembership } from "@/services/community-memberships";

export const runtime = "nodejs";

const schemaCreate = z.object({
	scope: z.enum(["community", "course", "support"]),
	courseSlug: z.string().trim().optional().or(z.literal("")),
	title: z.string().trim().min(2),
	content: z.string().trim().min(1),
	imageUrls: z.array(z.string().trim()).default([]),
});

export async function GET(request: NextRequest) {
	const area = request.nextUrl.searchParams.get("area") ?? "";
	const courseSlug = request.nextUrl.searchParams.get("courseSlug") ?? "";
	const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
	const limit = Number(request.nextUrl.searchParams.get("limit") ?? "10");

	if (area === "Announcements") {
		const result = await ForumStorage.listByFilter({ area, courseSlug, page, limit });
		return NextResponse.json(result);
	}

	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (area === "Community Forum") {
		if (!(await hasActiveCommunityMembership(user))) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
	}

	if (area === "Technical Support") {
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
	}

	if (area === "Course Forum") {
		if (!courseSlug) {
			return NextResponse.json({ error: "Course required" }, { status: 400 });
		}

		const course = await CourseStorage.findPublishedBySlug(courseSlug);
		if (!course) {
			return NextResponse.json({ error: "Course not found" }, { status: 404 });
		}

		const isEnrolled = await CourseEnrollmentStorage.isEnrolled(
			user.uuid,
			course.uuid ?? "",
		);
		if (!isEnrolled) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
	}

	const result = await ForumStorage.listByFilter({ area, courseSlug, page, limit });
	return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
	try {
		const csrfToken = request.headers.get(CSRF_HEADER) || request.cookies.get(CSRF_COOKIE)?.value
		if (!csrfToken || !verifyCsrfToken(csrfToken)) {
			return NextResponse.json({ error: "CSRF token missing or invalid" }, { status: 403 })
		}

		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const payload = schemaCreate.parse(await readJson(request));

		if (payload.scope === "community") {
			if (!(await hasActiveCommunityMembership(user))) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		}

		let courseSlug = "";
		if (payload.scope === "course") {
			if (!payload.courseSlug) {
				return NextResponse.json({ error: "Course required" }, { status: 400 });
			}

			const course = await CourseStorage.findPublishedBySlug(payload.courseSlug);
			if (!course) {
				return NextResponse.json({ error: "Course not found" }, { status: 404 });
			}

			const isEnrolled = await CourseEnrollmentStorage.isEnrolled(
				user.uuid,
				course.uuid ?? "",
			);
			if (!isEnrolled) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}

			courseSlug = course.slug ?? payload.courseSlug;
		}

		const area =
			payload.scope === "community"
				? "Community Forum"
				: payload.scope === "support"
					? "Technical Support"
					: "Course Forum";

		const item = await ForumStorage.create({
			title: payload.title,
			area,
			courseSlug,
			createdBy: "student",
			createdByUuid: user.uuid,
			authorName: `${user.firstName} ${user.lastName}`.trim(),
			content: payload.content,
			imageUrls: payload.imageUrls,
			status: "open",
		});

		if (payload.scope === "course" && payload.courseSlug) {
			const course = await CourseStorage.findPublishedBySlug(payload.courseSlug);
			if (course) {
				const baseUrl = getBaseUrl();
				sendForumReplyNotification({
					email: course.instructor === "Rabbi Yattah" ? "info@interjudaica.com" : `${course.instructorSlug}@interjudaica.com`,
					firstName: course.instructor,
					threadTitle: payload.title,
					replyAuthor: `${user.firstName} ${user.lastName}`.trim(),
					replyPreview: payload.content.slice(0, 200),
					forumUrl: `${baseUrl}/course/${payload.courseSlug}/foro`,
				}).catch(() => {});
			}
		}

		return NextResponse.json({ item }, { status: 201 });
	} catch (error) {
		return routeError(error);
	}
}
