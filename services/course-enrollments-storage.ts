import "server-only";

import { CourseEnrollmentModel, type TypeCourseEnrollment } from "@/models/course-enrollments";
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
			collection.createIndex(
				{ "data.courseUuid": 1, "data.userUuid": 1 },
				{ unique: true },
			),
			collection.createIndex({ "data.status": 1 }),
		]);

		CourseEnrollmentStorage.indexesReady = true;
	}

	static async create(input: Partial<TypeCourseEnrollment>) {
		await CourseEnrollmentStorage.ensureIndexes();
		const enrollment = new CourseEnrollmentModel(input as TypeCourseEnrollment);
		await MongoDBStorage._insert<TypeCourseEnrollment>(
			CourseEnrollmentStorage.COLLECTION,
			enrollment,
		);
		return enrollment.getData();
	}

	static async listByUser(userUuid: string) {
		await CourseEnrollmentStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeCourseEnrollment>(
			CourseEnrollmentStorage.COLLECTION,
			{ "data.userUuid": userUuid, "data.status": "active" },
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
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
