import "server-only";

import { MongoClient, type Db } from "mongodb";

const MONGODB_URL =
  process.env.MONGODB_URL ??
  process.env.MONGODB_URI ??
  process.env.MONGO_URI ??
  "mongodb://localhost:27017";

const MONGODB_NAME =
  process.env.MONGODB_NAME ??
  process.env.MONGODB_DATABASE ??
  process.env.MONGO_DB ??
  "interjudaica";

type MongoGlobal = typeof globalThis & {
  __interjudaicaMongoClientPromise?: Promise<MongoClient>;
};

const mongoGlobal = globalThis as MongoGlobal;

export async function getMongoClient() {
  if (!mongoGlobal.__interjudaicaMongoClientPromise) {
    const client = new MongoClient(MONGODB_URL);
    mongoGlobal.__interjudaicaMongoClientPromise = client.connect();
  }

  return mongoGlobal.__interjudaicaMongoClientPromise;
}

export async function getMongoDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(MONGODB_NAME);
}

