import "server-only";

import {
	CourseClassFileModel,
	type TypeCourseClassFile,
} from "@/models/course-class-files";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class CourseClassFileStorage extends MongoDBStorage<TypeCourseClassFile> {
	static readonly COLLECTION = "course_class_files";
	private static indexesReady = false;

	constructor() {
		super(CourseClassFileStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (CourseClassFileStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeCourseClassFile>(
			CourseClassFileStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.classUuid": 1, _added: -1 }),
			collection.createIndex({ "data.courseUuid": 1 }),
		]);

		CourseClassFileStorage.indexesReady = true;
	}

	static async listByClass(classUuid: string) {
		await CourseClassFileStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeCourseClassFile>(
			CourseClassFileStorage.COLLECTION,
			{ "data.classUuid": classUuid },
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async get(uuid: string) {
		await CourseClassFileStorage.ensureIndexes();
		const doc = await MongoDBStorage._getByUUID<TypeCourseClassFile>(
			CourseClassFileStorage.COLLECTION,
			uuid,
		);

		return doc?.data ?? null;
	}

	static async create(input: Partial<TypeCourseClassFile>) {
		await CourseClassFileStorage.ensureIndexes();
		const file = new CourseClassFileModel(input as TypeCourseClassFile);
		await MongoDBStorage._insert<TypeCourseClassFile>(
			CourseClassFileStorage.COLLECTION,
			file,
		);
		return file.getData();
	}

	static async delete(uuid: string) {
		await CourseClassFileStorage.ensureIndexes();
		return MongoDBStorage._delete(CourseClassFileStorage.COLLECTION, uuid);
	}
}
