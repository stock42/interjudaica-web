import "server-only";

import { unstable_cache } from "next/cache";
import type { TypeCourseClass } from "@/models/course-classes";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { CourseStorage } from "@/services/courses-storage";

export async function listCourseClasses(slug: string): Promise<TypeCourseClass[]> {
	const listCourseClassesCached = unstable_cache(
		async () => {
			const course = await CourseStorage.findPublishedBySlug(slug);
			if (!course?.uuid) {
				return [];
			}

			return CourseClassStorage.listByCourse(course.uuid);
		},
		["course-classes", slug],
		{ revalidate: 60 },
	);

	return listCourseClassesCached();
}
