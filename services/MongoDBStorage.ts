import "server-only";

import {
  type Collection,
  type Document,
  type Filter,
  type FindOptions,
  type Sort,
  type UpdateOptions,
} from "mongodb";
import { getMongoDatabase } from "@/services/mongodb";

export type TypeDocument<TData extends Document = Document> = {
  uuid: string;
  data: TData;
  _added: Date;
  _updated?: Date;
  _v: number;
  _n: number;
};

export type TypeOptionsUpdate = {
  bypassDocumentValidation?: boolean;
  upsert?: boolean;
};

export type TypePaginationOptions = {
  page: number;
  limit: number;
  sort?: Sort;
  projection?: Document;
};

export type TypePaginationResponse<T> = {
  docs: T[];
  count: number;
  limit: number;
  page: number;
  totalPages: number;
};

type ModelLike<TData extends Document> = {
  getData: () => TData;
  getUUID: () => string;
};

export class MongoDBStorage<TData extends Document = Document> {
  protected readonly collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected async getCollection(): Promise<Collection<TypeDocument<TData>>> {
    return MongoDBStorage.getCollection<TData>(this.collectionName);
  }

  protected async _insert(data: ModelLike<TData>) {
    return MongoDBStorage._insert<TData>(this.collectionName, data);
  }

  static async getCollection<TData extends Document = Document>(
    collectionName: string,
  ): Promise<Collection<TypeDocument<TData>>> {
    const db = await getMongoDatabase();
    return db.collection<TypeDocument<TData>>(collectionName);
  }

  static async _aggregate(collectionName: string, pipeline: Document[]): Promise<Document[]> {
    const collection = await MongoDBStorage.getCollection(collectionName);
    return collection.aggregate(pipeline).toArray();
  }

  static async _insert<TData extends Document>(
    collectionName: string,
    data: ModelLike<TData>,
  ) {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);
    return collection.insertOne({
      data: data.getData(),
      uuid: data.getUUID(),
      _added: new Date(),
      _updated: new Date(),
      _v: 1,
      _n: 0,
    });
  }

  static async _findOne<TData extends Document>(
    collectionName: string,
    query: Filter<TypeDocument<TData>>,
    projection?: Document,
    sort?: Sort,
  ) {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);
    const options: FindOptions = {};

    if (projection) {
      options.projection = projection;
    }

    if (sort) {
      options.sort = sort;
    }

    return collection.findOne(query, options);
  }

  static async _count<TData extends Document>(
    collectionName: string,
    query: Filter<TypeDocument<TData>> = {},
  ): Promise<number> {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);
    return collection.countDocuments(query);
  }

  static async _find<TData extends Document>(
    collectionName: string,
    query: Filter<TypeDocument<TData>>,
    projection?: Document,
    sort?: Sort,
  ) {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);
    const options: FindOptions = {};

    if (projection) {
      options.projection = projection;
    }

    if (sort) {
      options.sort = sort;
    }

    return collection.find(query, options).toArray();
  }

  static async _getByUUID<TData extends Document>(
    collectionName: string,
    uuid: string,
  ): Promise<TypeDocument<TData> | null> {
    return MongoDBStorage._findOne<TData>(collectionName, { uuid } as Filter<TypeDocument<TData>>);
  }

  static async _replaceData<TData extends Document>(
    collectionName: string,
    uuid: string,
    data: TData,
  ) {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);
    return collection.updateOne(
      { uuid } as Filter<TypeDocument<TData>>,
      {
        $set: {
          data,
          _updated: new Date(),
        },
        $inc: { _n: 1 },
      },
    );
  }

  static async _update<TData extends Document>(
    collectionName: string,
    where: Filter<TypeDocument<TData>>,
    update: Document,
    options?: UpdateOptions,
  ) {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);

    return collection.updateMany(
      where,
      {
        $set: { ...update, _updated: new Date() },
        $inc: { _n: 1 },
      },
      options,
    );
  }

  static async _deleteOne<TData extends Document>(
    collectionName: string,
    query: Filter<TypeDocument<TData>>,
  ) {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);
    return collection.deleteOne(query);
  }

  static async _deleteMany<TData extends Document>(
    collectionName: string,
    query: Filter<TypeDocument<TData>>,
  ) {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);
    return collection.deleteMany(query);
  }

  static async _delete(collectionName: string, uuid: string): Promise<number> {
    const result = await MongoDBStorage._deleteOne(collectionName, { uuid });
    return result.deletedCount;
  }

  static async _search<TData extends Document>(
    collectionName: string,
    query: Filter<TypeDocument<TData>>,
    fields: Document | undefined,
    options: TypePaginationOptions,
  ): Promise<TypePaginationResponse<TypeDocument<TData>>> {
    const collection = await MongoDBStorage.getCollection<TData>(collectionName);
    const page = Math.max(options.page || 1, 1);
    const limit = Math.max(options.limit || 30, 1);
    const count = await collection.countDocuments(query);
    const docs = await collection
      .find(query, { projection: fields })
      .sort(options.sort ?? { _added: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray();

    return {
      docs,
      count,
      limit,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }
}
