import "server-only";

import {
  PaperCategoryModel,
  type TypePaperCategory,
} from "@/models/paper-categories";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class PaperCategoryStorage extends MongoDBStorage<TypePaperCategory> {
  static readonly COLLECTION = "paper_categories";
  private static indexesReady = false;

  constructor() {
    super(PaperCategoryStorage.COLLECTION);
  }

  static async ensureIndexes() {
    if (PaperCategoryStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypePaperCategory>(
      PaperCategoryStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.slug": 1 }, { unique: true }),
      collection.createIndex({ "data.enabled": 1 }),
      collection.createIndex({ "data.name": "text" }),
    ]);

    PaperCategoryStorage.indexesReady = true;
  }

  static async list() {
    await PaperCategoryStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypePaperCategory>(
      PaperCategoryStorage.COLLECTION,
      {},
      undefined,
      { "data.name": 1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async get(uuid: string) {
    await PaperCategoryStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypePaperCategory>(
      PaperCategoryStorage.COLLECTION,
      uuid,
    );

    return doc?.data ?? null;
  }

  static async create(input: Partial<TypePaperCategory>) {
    await PaperCategoryStorage.ensureIndexes();
    const category = new PaperCategoryModel(input as TypePaperCategory);
    await MongoDBStorage._insert<TypePaperCategory>(
      PaperCategoryStorage.COLLECTION,
      category,
    );
    return category.getData();
  }

  static async update(uuid: string, input: Partial<TypePaperCategory>) {
    await PaperCategoryStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypePaperCategory>(
      PaperCategoryStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const category = new PaperCategoryModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypePaperCategory>(
      PaperCategoryStorage.COLLECTION,
      uuid,
      category.getData(),
    );

    return category.getData();
  }

  static async delete(uuid: string) {
    await PaperCategoryStorage.ensureIndexes();
    return MongoDBStorage._delete(PaperCategoryStorage.COLLECTION, uuid);
  }
}
