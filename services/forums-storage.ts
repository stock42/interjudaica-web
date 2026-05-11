import "server-only";

import { ForumThreadModel, type TypeForumThread } from "@/models/forums";
import { slugify } from "@/models/model-utils";
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
      collection.createIndex({ "data.area": 1, _added: -1 }),
      collection.createIndex({ "data.courseSlug": 1, _added: -1 }),
      collection.createIndex({ "data.paperUuid": 1 }),
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

  static async listByFilter({
    area,
    courseSlug,
    page = 1,
    limit = 10,
  }: {
    area?: string;
    courseSlug?: string;
    page?: number;
    limit?: number;
  }) {
    await ForumStorage.ensureIndexes();
    const filter: Record<string, string> = {};
    if (area) {
      filter["data.area"] = area;
    }
    if (courseSlug) {
      filter["data.courseSlug"] = courseSlug;
    }

    const result = await MongoDBStorage._search<TypeForumThread>(
      ForumStorage.COLLECTION,
      filter,
      undefined,
      {
        page,
        limit,
        sort: { _added: -1 },
      },
    );

    return {
      items: result.docs.map((doc) => doc.data),
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  static async getByPaperUuid(paperUuid: string) {
    await ForumStorage.ensureIndexes();
    const doc = await MongoDBStorage._findOne<TypeForumThread>(
      ForumStorage.COLLECTION,
      { "data.paperUuid": paperUuid },
    );

    return doc?.data ?? null;
  }

  static async ensureSystemThreads() {
    await ForumStorage.ensureIndexes();
    const defaults = [
      {
        title: "Community Forum",
        area: "Community Forum",
        createdBy: "system",
      },
      {
        title: "Technical Support",
        area: "Technical Support",
        createdBy: "system",
      },
      {
        title: "Announcements",
        area: "Announcements",
        createdBy: "system",
      },
    ];

    for (const item of defaults) {
      const existing = await MongoDBStorage._findOne<TypeForumThread>(
        ForumStorage.COLLECTION,
        { "data.slug": slugify(item.title) },
      );

      if (!existing) {
        const thread = new ForumThreadModel({
          title: item.title,
          area: item.area,
          createdBy: item.createdBy,
          status: "open",
        } as TypeForumThread);
        await MongoDBStorage._insert<TypeForumThread>(
          ForumStorage.COLLECTION,
          thread,
        );
      }
    }
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

