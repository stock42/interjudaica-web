import 'server-only'

import {
	CourseClassProgressModel,
	type TypeCourseClassProgress,
	type TypeCourseClassProgressInput,
} from '@/models/course-class-progress'
import { MongoDBStorage } from '@/services/MongoDBStorage'

export class CourseClassProgressStorage extends MongoDBStorage<TypeCourseClassProgress> {
	static readonly COLLECTION = 'course_class_progress'
	private static indexesReady = false

	constructor() {
		super(CourseClassProgressStorage.COLLECTION)
	}

	static async ensureIndexes() {
		if (CourseClassProgressStorage.indexesReady) {
			return
		}

		const collection = await MongoDBStorage.getCollection<TypeCourseClassProgress>(
			CourseClassProgressStorage.COLLECTION,
		)

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex(
				{ 'data.userUuid': 1, 'data.classUuid': 1 },
				{ unique: true },
			),
			collection.createIndex({ 'data.userUuid': 1, 'data.courseUuid': 1 }),
			collection.createIndex({ 'data.lastAccessedAt': -1 }),
		])

		CourseClassProgressStorage.indexesReady = true
	}

	static async listByUser(userUuid: string) {
		await CourseClassProgressStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeCourseClassProgress>(
			CourseClassProgressStorage.COLLECTION,
			{ 'data.userUuid': userUuid },
			undefined,
			{ 'data.lastAccessedAt': -1 },
		)

		return docs.map(doc => doc.data)
	}

	static async list() {
		await CourseClassProgressStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeCourseClassProgress>(
			CourseClassProgressStorage.COLLECTION,
			{},
			undefined,
			{ 'data.lastAccessedAt': -1 },
		)

		return docs.map(doc => doc.data)
	}

	static async listByUserCourse(userUuid: string, courseUuid: string) {
		await CourseClassProgressStorage.ensureIndexes()
		const docs = await MongoDBStorage._find<TypeCourseClassProgress>(
			CourseClassProgressStorage.COLLECTION,
			{ 'data.userUuid': userUuid, 'data.courseUuid': courseUuid },
			undefined,
			{ 'data.lastAccessedAt': -1 },
		)

		return docs.map(doc => doc.data)
	}

	static async getByUserClass(userUuid: string, classUuid: string) {
		await CourseClassProgressStorage.ensureIndexes()
		const doc = await MongoDBStorage._findOne<TypeCourseClassProgress>(
			CourseClassProgressStorage.COLLECTION,
			{ 'data.userUuid': userUuid, 'data.classUuid': classUuid },
		)

		return doc?.data ?? null
	}

	static async upsert(input: TypeCourseClassProgressInput) {
		await CourseClassProgressStorage.ensureIndexes()
		const existing = await MongoDBStorage._findOne<TypeCourseClassProgress>(
			CourseClassProgressStorage.COLLECTION,
			{ 'data.userUuid': input.userUuid, 'data.classUuid': input.classUuid },
		)
		const progress = new CourseClassProgressModel({
			...existing?.data,
			...input,
			uuid: existing?.uuid,
		})

		if (existing) {
			await MongoDBStorage._replaceData<TypeCourseClassProgress>(
				CourseClassProgressStorage.COLLECTION,
				existing.uuid,
				progress.getData(),
			)
		} else {
			await MongoDBStorage._insert<TypeCourseClassProgress>(
				CourseClassProgressStorage.COLLECTION,
				progress,
			)
		}

		return progress.getData()
	}

	static async setCompleted(input: {
		userUuid: string
		courseUuid: string
		classUuid: string
		completed: boolean
	}) {
		const now = new Date().toISOString()
		return CourseClassProgressStorage.upsert({
			...input,
			completedAt: input.completed ? now : '',
			lastAccessedAt: now,
		})
	}

	static async touch(input: { userUuid: string; courseUuid: string; classUuid: string }) {
		const existing = await CourseClassProgressStorage.getByUserClass(
			input.userUuid,
			input.classUuid,
		)
		return CourseClassProgressStorage.upsert({
			...input,
			completed: existing?.completed ?? false,
			completedAt: existing?.completedAt ?? '',
			lastAccessedAt: new Date().toISOString(),
		})
	}
}
