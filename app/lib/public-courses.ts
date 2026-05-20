import "server-only";

import { unstable_cache } from "next/cache";
import {
	toPublicCourse,
	type TypePublicCourse,
} from "@/models/courses";
import { CourseStorage } from "@/services/courses-storage";

const listPublicCoursesCached = unstable_cache(
	async () => {
		const courses = await CourseStorage.listPublished();
		return courses.map(toPublicCourse);
	},
	["public-courses"],
	{ revalidate: 60 },
);

export async function listPublicCourses(): Promise<TypePublicCourse[]> {
	return listPublicCoursesCached();
}

export async function getPublicCourseBySlug(
	slug: string,
): Promise<TypePublicCourse | null> {
	const getPublicCourseBySlugCached = unstable_cache(
		async () => {
			const record = await CourseStorage.findPublishedBySlug(slug);
			return record ? toPublicCourse(record) : null;
		},
		["public-course", slug],
		{ revalidate: 60 },
	);

	return getPublicCourseBySlugCached();
}
