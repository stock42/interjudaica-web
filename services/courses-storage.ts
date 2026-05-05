import "server-only";

import { CourseModel, type TypeCourse } from "@/models/courses";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class CourseStorage extends MongoDBStorage<TypeCourse> {
  static readonly COLLECTION = "courses";
  private static indexesReady = false;

  constructor() {
    super(CourseStorage.COLLECTION);
  }

  static async ensureIndexes() {
    if (CourseStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypeCourse>(
      CourseStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.slug": 1 }, { unique: true }),
      collection.createIndex({ "data.status": 1 }),
      collection.createIndex({ "data.categoryUuid": 1 }),
      collection.createIndex({ "data.instructorUuid": 1 }),
      collection.createIndex({ "data.title": "text", "data.category": "text" }),
    ]);

    CourseStorage.indexesReady = true;
  }

  static async list() {
    await CourseStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeCourse>(
      CourseStorage.COLLECTION,
      {},
      undefined,
      { _added: -1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async listPublished() {
    await CourseStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeCourse>(
      CourseStorage.COLLECTION,
      { "data.status": "published" },
      undefined,
      { "data.startDate": 1, _added: -1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async findPublishedBySlug(slug: string) {
    await CourseStorage.ensureIndexes();
    const doc = await MongoDBStorage._findOne<TypeCourse>(
      CourseStorage.COLLECTION,
      { "data.status": "published", "data.slug": slug },
    );

    return doc?.data ?? null;
  }

  static async get(uuid: string) {
    await CourseStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypeCourse>(
      CourseStorage.COLLECTION,
      uuid,
    );

    return doc?.data ?? null;
  }

  static async create(input: Partial<TypeCourse>) {
    await CourseStorage.ensureIndexes();
    const course = new CourseModel(input as TypeCourse);
    await MongoDBStorage._insert<TypeCourse>(CourseStorage.COLLECTION, course);
    return course.getData();
  }

  static async update(uuid: string, input: Partial<TypeCourse>) {
    await CourseStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypeCourse>(
      CourseStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const course = new CourseModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypeCourse>(
      CourseStorage.COLLECTION,
      uuid,
      course.getData(),
    );

    return course.getData();
  }

  static async delete(uuid: string) {
    await CourseStorage.ensureIndexes();
    return MongoDBStorage._delete(CourseStorage.COLLECTION, uuid);
  }
}
