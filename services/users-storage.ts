import "server-only";

import {
  UserModel,
  type TypeSafeUser,
  type TypeUser,
  type TypeUserSignup,
} from "@/models/users";
import { MongoDBStorage, type TypeDocument } from "@/services/MongoDBStorage";

export class UserStorage extends MongoDBStorage<TypeUser> {
  static readonly COLLECTION = "users";
  private static indexesReady = false;

  constructor() {
    super(UserStorage.COLLECTION);
  }

  static toSafeUser(document: TypeDocument<TypeUser>): TypeSafeUser {
    return {
      uuid: document.uuid,
      email: document.data.email,
      firstName: document.data.firstName,
      lastName: document.data.lastName,
      country: document.data.country,
      state: document.data.state,
      city: document.data.city,
      role: document.data.role,
      status: document.data.status,
      communityStatus: document.data.communityStatus,
    };
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
      collection.createIndex({
        "data.email": "text",
        "data.firstName": "text",
        "data.lastName": "text",
        "data.country": "text",
        "data.state": "text",
        "data.city": "text",
      }),
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

    return docs.map((doc) => UserStorage.toSafeUser(doc));
  }

  static async get(uuid: string) {
    await UserStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypeUser>(
      UserStorage.COLLECTION,
      uuid,
    );

    return doc ? UserStorage.toSafeUser(doc) : null;
  }

  static async create(input: Partial<TypeUser>) {
    await UserStorage.ensureIndexes();
    const user = new UserModel(input as TypeUser);
    await MongoDBStorage._insert<TypeUser>(UserStorage.COLLECTION, user);
    return user.toSafeData();
  }

  static async register(input: TypeUserSignup) {
    await UserStorage.ensureIndexes();
    const user = new UserModel({
      ...input,
      password: "",
      role: "student",
      status: "active",
      communityStatus: "none",
    });

    await user.setPassword(input.password);
    await MongoDBStorage._insert<TypeUser>(UserStorage.COLLECTION, user);
    return user.toSafeData();
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

    return user.toSafeData();
  }

  static async delete(uuid: string) {
    await UserStorage.ensureIndexes();
    return MongoDBStorage._delete(UserStorage.COLLECTION, uuid);
  }

  static async findByEmail(email: string) {
    await UserStorage.ensureIndexes();

    return MongoDBStorage._findOne<TypeUser>(UserStorage.COLLECTION, {
      "data.email": email.toLowerCase(),
    });
  }

  static async findByUUID(uuid: string) {
    await UserStorage.ensureIndexes();
    return MongoDBStorage._getByUUID<TypeUser>(UserStorage.COLLECTION, uuid);
  }

  static async authenticate(email: string, password: string) {
    const document = await UserStorage.findByEmail(email);

    if (!document || document.data.status !== "active") {
      return null;
    }

    const user = new UserModel(document.data);
    const validPassword = await user.verifyPassword(password);

    if (!validPassword) {
      return null;
    }

    return UserStorage.toSafeUser(document);
  }
}
