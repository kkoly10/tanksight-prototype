/**
 * Export the deterministic seed collections to JSON (and a couple of CSVs) so the
 * mock PAUT-style data can be reviewed directly or imported into MongoDB.
 *
 *   npm run export:seed   ->   writes ./seed-export/*
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { seedData } from "../src/lib/data/seed";
import { buildRegionSummaries } from "../src/lib/domain/inspection-metrics";

const OUT_DIR = join(process.cwd(), "seed-export");

function writeJson(name: string, data: unknown) {
  writeFileSync(join(OUT_DIR, name), JSON.stringify(data, null, 2), "utf8");
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => String(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const files: [string, unknown[]][] = [
    ["clients.json", seedData.clients],
    ["users.json", seedData.users],
    ["sites.json", seedData.sites],
    ["tanks.json", seedData.tanks],
    ["inspectionRuns.json", seedData.inspectionRuns],
    ["measurementCells.json", seedData.measurementCells],
    ["findings.json", seedData.findings],
    ["reportJobs.json", seedData.reportJobs],
  ];
  for (const [name, data] of files) writeJson(name, data);

  // Optional CSV exports — inspection/engineering teams often review tabular data.
  writeFileSync(
    join(OUT_DIR, "measurementCells.csv"),
    toCsv(seedData.measurementCells as unknown as Record<string, unknown>[]),
    "utf8",
  );

  const tk104Cells = seedData.measurementCells.filter(
    (c) => c.inspectionRunId === "run_tk104_2026",
  );
  const tk104Findings = seedData.findings.filter(
    (f) => f.inspectionRunId === "run_tk104_2026",
  );
  writeFileSync(
    join(OUT_DIR, "regionSummaries-TK-104-2026.csv"),
    toCsv(
      buildRegionSummaries(tk104Cells, tk104Findings) as unknown as Record<
        string,
        unknown
      >[],
    ),
    "utf8",
  );

  console.log("Seed export complete:");
  for (const [name, data] of files) {
    console.log(`  ${name.replace(".json", "")}: ${data.length}`);
  }
  console.log(`  + measurementCells.csv, regionSummaries-TK-104-2026.csv`);
  console.log(`Output: ./seed-export`);
}

main();
