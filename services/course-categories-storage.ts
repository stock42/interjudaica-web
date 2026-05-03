import "server-only";

import {
  CourseCategoryModel,
  type TypeCourseCategory,
} from "@/models/course-categories";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class CourseCategoryStorage extends MongoDBStorage<TypeCourseCategory> {
  static readonly COLLECTION = "course_categories";
  private static indexesReady = false;

  constructor() {
    super(CourseCategoryStorage.COLLECTION);
  }

  static async ensureIndexes() {
    if (CourseCategoryStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypeCourseCategory>(
      CourseCategoryStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.slug": 1 }, { unique: true }),
      collection.createIndex({ "data.enabled": 1 }),
      collection.createIndex({ "data.name": "text" }),
    ]);

    CourseCategoryStorage.indexesReady = true;
  }

  static async list() {
    await CourseCategoryStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeCourseCategory>(
      CourseCategoryStorage.COLLECTION,
      {},
      undefined,
      { "data.name": 1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async get(uuid: string) {
    await CourseCategoryStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypeCourseCategory>(
      CourseCategoryStorage.COLLECTION,
      uuid,
    );

    return doc?.data ?? null;
  }

  static async create(input: Partial<TypeCourseCategory>) {
    await CourseCategoryStorage.ensureIndexes();
    const category = new CourseCategoryModel(input as TypeCourseCategory);
    await MongoDBStorage._insert<TypeCourseCategory>(
      CourseCategoryStorage.COLLECTION,
      category,
    );
    return category.getData();
  }

  static async update(uuid: string, input: Partial<TypeCourseCategory>) {
    await CourseCategoryStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypeCourseCategory>(
      CourseCategoryStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const category = new CourseCategoryModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypeCourseCategory>(
      CourseCategoryStorage.COLLECTION,
      uuid,
      category.getData(),
    );

    return category.getData();
  }

  static async delete(uuid: string) {
    await CourseCategoryStorage.ensureIndexes();
    return MongoDBStorage._delete(CourseCategoryStorage.COLLECTION, uuid);
  }
}

