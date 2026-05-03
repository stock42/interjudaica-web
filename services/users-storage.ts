import "server-only";

import { UserModel, type TypeUser } from "@/models/users";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class UserStorage extends MongoDBStorage<TypeUser> {
  static readonly COLLECTION = "users";
  private static indexesReady = false;

  constructor() {
    super(UserStorage.COLLECTION);
  }

  static async ensureIndexes() {
    if (UserStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypeUser>(
      UserStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.email": 1 }, { unique: true }),
      collection.createIndex({ "data.status": 1, "data.communityStatus": 1 }),
      collection.createIndex({ "data.email": "text", "data.firstName": "text", "data.lastName": "text" }),
    ]);

    UserStorage.indexesReady = true;
  }

  static async list() {
    await UserStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeUser>(
      UserStorage.COLLECTION,
      {},
      undefined,
      { _added: -1 },
    );

    return docs.map((doc) => doc.data);
  }

  static async get(uuid: string) {
    await UserStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypeUser>(
      UserStorage.COLLECTION,
      uuid,
    );

    return doc?.data ?? null;
  }

  static async create(input: Partial<TypeUser>) {
    await UserStorage.ensureIndexes();
    const user = new UserModel(input as TypeUser);
    await MongoDBStorage._insert<TypeUser>(UserStorage.COLLECTION, user);
    return user.getData();
  }

  static async update(uuid: string, input: Partial<TypeUser>) {
    await UserStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypeUser>(
      UserStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const user = new UserModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypeUser>(
      UserStorage.COLLECTION,
      uuid,
      user.getData(),
    );

    return user.getData();
  }

  static async delete(uuid: string) {
    await UserStorage.ensureIndexes();
    return MongoDBStorage._delete(UserStorage.COLLECTION, uuid);
  }
}

