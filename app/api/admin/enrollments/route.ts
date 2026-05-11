import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { CourseStorage } from "@/services/courses-storage";
import { UserStorage } from "@/services/users-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaEnrollment = z.object({
	userUuid: z.string().uuid(),
	courseUuid: z.string().uuid(),
});

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	try {
		const payload = schemaEnrollment.parse(await readJson(request));
		const [user, course] = await Promise.all([
			UserStorage.get(payload.userUuid),
			CourseStorage.get(payload.courseUuid),
		]);

		if (!user || !course) {
			return NextResponse.json({ error: "Invalid user or course" }, { status: 400 });
		}

		const alreadyEnrolled = await CourseEnrollmentStorage.isEnrolled(
			payload.userUuid,
			payload.courseUuid,
		);
		if (alreadyEnrolled) {
			return NextResponse.json(
				{ error: "Student already enrolled" },
				{ status: 409 },
			);
		}

		const enrollment = await CourseEnrollmentStorage.create({
			userUuid: payload.userUuid,
			courseUuid: payload.courseUuid,
			status: "active",
			purchasedAt: new Date().toISOString(),
		});

		return NextResponse.json({ item: enrollment }, { status: 201 });
	} catch (error) {
		return routeError(error);
	}
}
