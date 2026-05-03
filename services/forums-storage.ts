import "server-only";

import { ForumThreadModel, type TypeForumThread } from "@/models/forums";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class ForumStorage extends MongoDBStorage<TypeForumThread> {
  static readonly COLLECTION = "forum_threads";
  private static indexesReady = false;

  constructor() {
    super(ForumStorage.COLLECTION);
  }

  static async ensureIndexes() {
    if (ForumStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypeForumThread>(
      ForumStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.slug": 1 }, { unique: true }),
      collection.createIndex({ "data.status": 1, "data.featured": 1 }),
      collection.createIndex({ "data.title": "text", "data.area": "text" }),
    ]);

    ForumStorage.indexesReady = true;
  }

  static async list() {
    await ForumStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeForumThread>(
      ForumStorage.COLLECTION,
      {},
      undefined,
      { _added: -1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async get(uuid: string) {
    await ForumStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypeForumThread>(
      ForumStorage.COLLECTION,
      uuid,
    );

    return doc?.data ?? null;
  }

  static async create(input: Partial<TypeForumThread>) {
    await ForumStorage.ensureIndexes();
    const thread = new ForumThreadModel(input as TypeForumThread);
    await MongoDBStorage._insert<TypeForumThread>(ForumStorage.COLLECTION, thread);
    return thread.getData();
  }

  static async update(uuid: string, input: Partial<TypeForumThread>) {
    await ForumStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypeForumThread>(
      ForumStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const thread = new ForumThreadModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypeForumThread>(
      ForumStorage.COLLECTION,
      uuid,
      thread.getData(),
    );

    return thread.getData();
  }

  static async delete(uuid: string) {
    await ForumStorage.ensureIndexes();
    return MongoDBStorage._delete(ForumStorage.COLLECTION, uuid);
  }
}

