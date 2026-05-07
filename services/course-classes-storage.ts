import "server-only";

import { CourseClassModel, type TypeCourseClass } from "@/models/course-classes";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class CourseClassStorage extends MongoDBStorage<TypeCourseClass> {
	static readonly COLLECTION = "course_classes";
	private static indexesReady = false;

	constructor() {
		super(CourseClassStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (CourseClassStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeCourseClass>(
			CourseClassStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.courseUuid": 1, "data.order": 1 }),
		]);

		CourseClassStorage.indexesReady = true;
	}

	static async listByCourse(courseUuid: string) {
		await CourseClassStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeCourseClass>(
			CourseClassStorage.COLLECTION,
			{ "data.courseUuid": courseUuid },
			undefined,
			{ "data.order": 1, _added: 1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async get(uuid: string) {
		await CourseClassStorage.ensureIndexes();
		const doc = await MongoDBStorage._getByUUID<TypeCourseClass>(
			CourseClassStorage.COLLECTION,
			uuid,
		);

		return doc?.data ?? null;
	}

	static async create(input: Partial<TypeCourseClass>) {
		await CourseClassStorage.ensureIndexes();
		const courseClass = new CourseClassModel(input as TypeCourseClass);
		await MongoDBStorage._insert<TypeCourseClass>(
			CourseClassStorage.COLLECTION,
			courseClass,
		);
		return courseClass.getData();
	}

	static async update(uuid: string, input: Partial<TypeCourseClass>) {
		await CourseClassStorage.ensureIndexes();
		const existing = await MongoDBStorage._getByUUID<TypeCourseClass>(
			CourseClassStorage.COLLECTION,
			uuid,
		);

		if (!existing) {
			return null;
		}

		const courseClass = new CourseClassModel({
			...existing.data,
			...input,
			uuid,
		});

		await MongoDBStorage._replaceData<TypeCourseClass>(
			CourseClassStorage.COLLECTION,
			uuid,
			courseClass.getData(),
		);

		return courseClass.getData();
	}

	static async delete(uuid: string) {
		await CourseClassStorage.ensureIndexes();
		return MongoDBStorage._delete(CourseClassStorage.COLLECTION, uuid);
	}
}
