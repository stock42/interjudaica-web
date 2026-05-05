import "server-only";

import {
  toPublicCourse,
  type TypePublicCourse,
} from "@/models/courses";
import { CourseStorage } from "@/services/courses-storage";

export async function listPublicCourses(): Promise<TypePublicCourse[]> {
  const courses = await CourseStorage.listPublished();
  return courses.map(toPublicCourse);
}

export async function getPublicCourseBySlug(
  slug: string,
): Promise<TypePublicCourse | null> {
  const record = await CourseStorage.findPublishedBySlug(slug);
  return record ? toPublicCourse(record) : null;
}
