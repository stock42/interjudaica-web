import "server-only";

import { type TypeCourseEnrollment } from "@/models/course-enrollments";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class CourseEnrollmentStorage extends MongoDBStorage<TypeCourseEnrollment> {
	static readonly COLLECTION = "course_enrollments";
	private static indexesReady = false;

	constructor() {
		super(CourseEnrollmentStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (CourseEnrollmentStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeCourseEnrollment>(
			CourseEnrollmentStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.courseUuid": 1, "data.userUuid": 1 }),
			collection.createIndex({ "data.status": 1 }),
		]);

		CourseEnrollmentStorage.indexesReady = true;
	}

	static async isEnrolled(userUuid: string, courseUuid: string) {
		await CourseEnrollmentStorage.ensureIndexes();
		const doc = await MongoDBStorage._findOne<TypeCourseEnrollment>(
			CourseEnrollmentStorage.COLLECTION,
			{
				"data.userUuid": userUuid,
				"data.courseUuid": courseUuid,
				"data.status": "active",
			},
		);

		return Boolean(doc);
	}
}
