import "server-only";

import { InstructorModel, type TypeInstructor } from "@/models/instructors";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class InstructorStorage extends MongoDBStorage<TypeInstructor> {
  static readonly COLLECTION = "instructors";
  private static indexesReady = false;

  constructor() {
    super(InstructorStorage.COLLECTION);
  }

  static async ensureIndexes() {
    if (InstructorStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypeInstructor>(
      InstructorStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.slug": 1 }, { unique: true }),
      collection.createIndex({ "data.enabled": 1 }),
      collection.createIndex({
        "data.displayName": "text",
        "data.email": "text",
      }),
    ]);

    InstructorStorage.indexesReady = true;
  }

  static async list() {
    await InstructorStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeInstructor>(
      InstructorStorage.COLLECTION,
      {},
      undefined,
      { "data.displayName": 1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async get(uuid: string) {
    await InstructorStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypeInstructor>(
      InstructorStorage.COLLECTION,
      uuid,
    );

    return doc?.data ?? null;
  }

  static async create(input: Partial<TypeInstructor>) {
    await InstructorStorage.ensureIndexes();
    const instructor = new InstructorModel(input as TypeInstructor);
    await MongoDBStorage._insert<TypeInstructor>(
      InstructorStorage.COLLECTION,
      instructor,
    );
    return instructor.getData();
  }

  static async update(uuid: string, input: Partial<TypeInstructor>) {
    await InstructorStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypeInstructor>(
      InstructorStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const instructor = new InstructorModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypeInstructor>(
      InstructorStorage.COLLECTION,
      uuid,
      instructor.getData(),
    );

    return instructor.getData();
  }

  static async delete(uuid: string) {
    await InstructorStorage.ensureIndexes();
    return MongoDBStorage._delete(InstructorStorage.COLLECTION, uuid);
  }
}

