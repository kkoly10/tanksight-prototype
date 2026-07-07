import { MongoClient, type Db } from "mongodb";

/**
 * MongoDB connection helper. The client is created lazily and memoized so the
 * whole app shares one connection pool. Nothing here connects at import time —
 * a connection is only opened on the first query, and only when the Mongo
 * repository is actually selected (DATA_SOURCE=mongodb).
 */

export const COLLECTIONS = {
  clients: "clients",
  users: "users",
  sites: "sites",
  tanks: "tanks",
  inspectionRuns: "inspectionRuns",
  measurementCells: "measurementCells",
  findings: "findings",
  reportJobs: "reportJobs",
} as const;

let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Provide it in .env.local to use DATA_SOURCE=mongodb.",
    );
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || "tanksight");
}
