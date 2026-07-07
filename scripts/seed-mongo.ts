/**
 * Load the deterministic seed collections into MongoDB Atlas and create the
 * production indexes. Run once after setting MONGODB_URI in .env.local:
 *
 *   npm run db:seed
 *
 * Then run the app against Atlas with DATA_SOURCE=mongodb.
 */
import { MongoClient } from "mongodb";
import { COLLECTIONS } from "../src/lib/data/mongo";
import { seedData } from "../src/lib/data/seed";

// Node 20.12+/22 native .env loader — no dotenv dependency needed.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional; MONGODB_URI may already be in the environment.
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env.local first.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "tanksight");

  const collections: [string, object[]][] = [
    [COLLECTIONS.clients, seedData.clients],
    [COLLECTIONS.users, seedData.users],
    [COLLECTIONS.sites, seedData.sites],
    [COLLECTIONS.tanks, seedData.tanks],
    [COLLECTIONS.inspectionRuns, seedData.inspectionRuns],
    [COLLECTIONS.measurementCells, seedData.measurementCells],
    [COLLECTIONS.findings, seedData.findings],
    [COLLECTIONS.reportJobs, seedData.reportJobs],
  ];

  for (const [name, docs] of collections) {
    const col = db.collection(name);
    await col.deleteMany({});
    if (docs.length > 0) await col.insertMany(docs as object[]);
    console.log(`  ${name}: ${docs.length}`);
  }

  // Indexes matching the documented production mapping.
  await db.collection(COLLECTIONS.sites).createIndex({ clientId: 1, slug: 1 });
  await db.collection(COLLECTIONS.tanks).createIndex({ clientId: 1, siteId: 1, slug: 1 });
  await db
    .collection(COLLECTIONS.inspectionRuns)
    .createIndex({ clientId: 1, tankId: 1, inspectedAt: -1 });
  await db
    .collection(COLLECTIONS.measurementCells)
    .createIndex({ inspectionRunId: 1, region: 1, severity: 1 });
  await db
    .collection(COLLECTIONS.measurementCells)
    .createIndex({ clientId: 1, siteId: 1, tankId: 1, inspectionRunId: 1 });
  await db.collection(COLLECTIONS.findings).createIndex({ inspectionRunId: 1, severity: 1 });
  await db
    .collection(COLLECTIONS.reportJobs)
    .createIndex({ clientId: 1, status: 1, createdAt: -1 });

  console.log("\nSeed + indexes complete.");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
