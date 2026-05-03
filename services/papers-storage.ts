import "server-only";

import { PaperModel, type TypePaper } from "@/models/papers";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class PaperStorage extends MongoDBStorage<TypePaper> {
  static readonly COLLECTION = "papers";
  private static indexesReady = false;

  constructor() {
    super(PaperStorage.COLLECTION);
  }

  static async ensureIndexes() {
    if (PaperStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypePaper>(
      PaperStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.slug": 1 }, { unique: true }),
      collection.createIndex({ "data.status": 1, "data.visibility": 1 }),
      collection.createIndex({ "data.title": "text", "data.category": "text" }),
    ]);

    PaperStorage.indexesReady = true;
  }

  static async list() {
    await PaperStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypePaper>(
      PaperStorage.COLLECTION,
      {},
      undefined,
      { _added: -1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async get(uuid: string) {
    await PaperStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypePaper>(
      PaperStorage.COLLECTION,
      uuid,
    );

    return doc?.data ?? null;
  }

  static async create(input: Partial<TypePaper>) {
    await PaperStorage.ensureIndexes();
    const paper = new PaperModel(input as TypePaper);
    await MongoDBStorage._insert<TypePaper>(PaperStorage.COLLECTION, paper);
    return paper.getData();
  }

  static async update(uuid: string, input: Partial<TypePaper>) {
    await PaperStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypePaper>(
      PaperStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const paper = new PaperModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypePaper>(
      PaperStorage.COLLECTION,
      uuid,
      paper.getData(),
    );

    return paper.getData();
  }

  static async delete(uuid: string) {
    await PaperStorage.ensureIndexes();
    return MongoDBStorage._delete(PaperStorage.COLLECTION, uuid);
  }
}

