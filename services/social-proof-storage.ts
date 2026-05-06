import "server-only";

import { SocialProofModel, type TypeSocialProof } from "@/models/social-proof";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class SocialProofStorage extends MongoDBStorage<TypeSocialProof> {
  static readonly COLLECTION = "social_proof";
  private static indexesReady = false;

  constructor() {
    super(SocialProofStorage.COLLECTION);
  }

  static async ensureIndexes() {
    if (SocialProofStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypeSocialProof>(
      SocialProofStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.status": 1, "data.order": 1 }),
      collection.createIndex({ "data.name": "text", "data.detail": "text" }),
    ]);

    SocialProofStorage.indexesReady = true;
  }

  static async list() {
    await SocialProofStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeSocialProof>(
      SocialProofStorage.COLLECTION,
      {},
      undefined,
      { _added: -1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async listPublished() {
    await SocialProofStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeSocialProof>(
      SocialProofStorage.COLLECTION,
      { "data.status": "published" },
      undefined,
      { "data.order": 1, _added: -1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async get(uuid: string) {
    await SocialProofStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypeSocialProof>(
      SocialProofStorage.COLLECTION,
      uuid,
    );

    return doc?.data ?? null;
  }

  static async create(input: Partial<TypeSocialProof>) {
    await SocialProofStorage.ensureIndexes();
    const proof = new SocialProofModel(input as TypeSocialProof);
    await MongoDBStorage._insert<TypeSocialProof>(
      SocialProofStorage.COLLECTION,
      proof,
    );
    return proof.getData();
  }

  static async update(uuid: string, input: Partial<TypeSocialProof>) {
    await SocialProofStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypeSocialProof>(
      SocialProofStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const proof = new SocialProofModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypeSocialProof>(
      SocialProofStorage.COLLECTION,
      uuid,
      proof.getData(),
    );

    return proof.getData();
  }

  static async delete(uuid: string) {
    await SocialProofStorage.ensureIndexes();
    return MongoDBStorage._delete(SocialProofStorage.COLLECTION, uuid);
  }
}
