import "server-only";

import {
  OperatorModel,
  type TypeOperator,
  type TypeOperatorCreate,
  type TypeOperatorUpdate,
  type TypeSafeOperator,
} from "@/models/operators";
import { MongoDBStorage, type TypeDocument } from "@/services/MongoDBStorage";

export class OperatorStorage extends MongoDBStorage<TypeOperator> {
  static readonly COLLECTION = "operators";
  private static indexesReady = false;

  constructor() {
    super(OperatorStorage.COLLECTION);
  }

  static toSafeOperator(document: TypeDocument<TypeOperator>): TypeSafeOperator {
    return {
      uuid: document.uuid,
      email: document.data.email,
      firstName: document.data.firstName,
      lastName: document.data.lastName,
      enabled: document.data.enabled,
      level: document.data.level,
    };
  }

  static async ensureIndexes() {
    if (OperatorStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypeOperator>(
      OperatorStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ "data.email": 1 }, { unique: true }),
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.enabled": 1 }),
    ]);

    OperatorStorage.indexesReady = true;
  }

  static async ensureDefaultOperator() {
    await OperatorStorage.ensureIndexes();

    const count = await MongoDBStorage._count<TypeOperator>(
      OperatorStorage.COLLECTION,
    );

    if (count > 0) {
      return;
    }

    const operator = new OperatorModel({
      email: "admin@interjudaica.com",
      firstName: "Admin",
      lastName: "InterJudaica",
      enabled: true,
      level: 50,
      password: "",
    });

    await operator.setPassword("1NterJuda1c4");
    await MongoDBStorage._insert<TypeOperator>(
      OperatorStorage.COLLECTION,
      operator,
    );
  }

  static async list() {
    await OperatorStorage.ensureDefaultOperator();
    const docs = await MongoDBStorage._find<TypeOperator>(
      OperatorStorage.COLLECTION,
      {},
      undefined,
      { "data.email": 1 },
    );

    return docs.map((doc) => OperatorStorage.toSafeOperator(doc));
  }

  static async get(uuid: string) {
    await OperatorStorage.ensureDefaultOperator();
    const doc = await MongoDBStorage._getByUUID<TypeOperator>(
      OperatorStorage.COLLECTION,
      uuid,
    );

    return doc ? OperatorStorage.toSafeOperator(doc) : null;
  }

  static async create(input: TypeOperatorCreate) {
    await OperatorStorage.ensureIndexes();
    const operator = new OperatorModel({
      email: input.email,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      enabled: input.enabled,
      level: input.level,
      password: "",
    });

    await operator.setPassword(input.password);
    await MongoDBStorage._insert<TypeOperator>(
      OperatorStorage.COLLECTION,
      operator,
    );

    return operator.toSafeData();
  }

  static async update(uuid: string, input: TypeOperatorUpdate) {
    await OperatorStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypeOperator>(
      OperatorStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const operator = new OperatorModel({
      ...existing.data,
      ...input,
      uuid,
      password: existing.data.password,
    });

    if (input.password?.trim()) {
      await operator.setPassword(input.password);
      operator.getData().passwordChangedAt = new Date().toISOString();
    }

    await MongoDBStorage._replaceData<TypeOperator>(
      OperatorStorage.COLLECTION,
      uuid,
      operator.getData(),
    );

    return operator.toSafeData();
  }

  static async delete(uuid: string) {
    await OperatorStorage.ensureIndexes();
    return MongoDBStorage._delete(OperatorStorage.COLLECTION, uuid);
  }

  static async findByEmail(email: string) {
    await OperatorStorage.ensureIndexes();

    return MongoDBStorage._findOne<TypeOperator>(OperatorStorage.COLLECTION, {
      "data.email": email.toLowerCase(),
    });
  }

  static async findByUUID(uuid: string) {
    await OperatorStorage.ensureIndexes();
    return MongoDBStorage._getByUUID<TypeOperator>(
      OperatorStorage.COLLECTION,
      uuid,
    );
  }

  static async authenticate(email: string, password: string) {
    await OperatorStorage.ensureDefaultOperator();

    const document = await OperatorStorage.findByEmail(email);

    if (!document || !document.data.enabled) {
      return null;
    }

    const operator = new OperatorModel(document.data);
    const validPassword = await operator.verifyPassword(password);

    if (!validPassword) {
      return null;
    }

    return OperatorStorage.toSafeOperator(document);
  }

  static async updateRaw(uuid: string, data: Partial<TypeOperator>) {
    await OperatorStorage.ensureIndexes();
    const update: Record<string, unknown> = { _updated: new Date() };
    for (const [key, value] of Object.entries(data)) {
      update[`data.${key}`] = value;
    }
    return MongoDBStorage._update<TypeOperator>(
      OperatorStorage.COLLECTION,
      { "data.uuid": uuid },
      update,
    );
  }
}
