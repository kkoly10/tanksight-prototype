import type {
  Client,
  Finding,
  InspectionRun,
  MeasurementCell,
  ReportJob,
  Severity,
  Site,
  Tank,
  User,
} from "@/lib/types";
import { generateMeasurementCells } from "@/lib/data/generate-measurements";
import { buildRegionSummaries } from "@/lib/domain/inspection-metrics";
import { REGION_LABELS } from "@/lib/domain/region";

/**
 * Deterministic seed data, structured exactly like MongoDB collections. This is
 * the ONLY place literal demo records live; everything else reads through the
 * repository. To move to a real database you import these arrays and repoint the
 * repository — no other layer changes.
 *
 * Demo world:
 *   Acme Energy (client) -> Sterling Terminal / Baytown Terminal / Corpus Christi
 *   Showcase asset: TK-104 @ Sterling Terminal, diesel, 120 ft, 0.250" nominal,
 *   inspected 2024 and 2026 (2026 is worse — the report/heatmap demo).
 */

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
export const clients: Client[] = [
  { id: "client_acme", name: "Acme Energy" },
  { id: "client_northwind", name: "Northwind Petroleum" },
  { id: "client_gulfstream", name: "Gulfstream Storage" },
];

// ---------------------------------------------------------------------------
// Users (demo accounts)
// ---------------------------------------------------------------------------
export const users: User[] = [
  {
    id: "user_client_acme",
    name: "Dana Reeves",
    email: "client@acme.example",
    role: "client",
    clientId: "client_acme",
  },
  {
    id: "user_inspector",
    name: "Sam Ortiz",
    email: "inspector@tanksight.example",
    role: "inspector",
  },
];

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------
export const sites: Site[] = [
  {
    id: "site_sterling",
    clientId: "client_acme",
    slug: "sterling-terminal",
    name: "Sterling Terminal",
    location: "Sterling, VA",
  },
  {
    id: "site_baytown",
    clientId: "client_acme",
    slug: "baytown-terminal",
    name: "Baytown Terminal",
    location: "Baytown, TX",
  },
  {
    id: "site_corpus",
    clientId: "client_acme",
    slug: "corpus-christi-yard",
    name: "Corpus Christi Yard",
    location: "Corpus Christi, TX",
  },
  {
    id: "site_northwind_gulf",
    clientId: "client_northwind",
    slug: "gulf-terminal",
    name: "Gulf Terminal",
    location: "Pasadena, TX",
  },
  {
    id: "site_gulfstream_delta",
    clientId: "client_gulfstream",
    slug: "delta-facility",
    name: "Delta Facility",
    location: "Norco, LA",
  },
];

// ---------------------------------------------------------------------------
// Tanks
// ---------------------------------------------------------------------------
const NOMINAL = 0.25;

export const tanks: Tank[] = [
  // Acme — Sterling Terminal
  { id: "tank_tk101", clientId: "client_acme", siteId: "site_sterling", slug: "tk-101", tankNumber: "TK-101", diameterFeet: 100, product: "Gasoline", nominalThicknessInches: NOMINAL },
  { id: "tank_tk104", clientId: "client_acme", siteId: "site_sterling", slug: "tk-104", tankNumber: "TK-104", diameterFeet: 120, product: "Diesel", nominalThicknessInches: NOMINAL },
  { id: "tank_tk108", clientId: "client_acme", siteId: "site_sterling", slug: "tk-108", tankNumber: "TK-108", diameterFeet: 90, product: "Jet Fuel", nominalThicknessInches: NOMINAL },
  // Acme — Baytown Terminal
  { id: "tank_tk201", clientId: "client_acme", siteId: "site_baytown", slug: "tk-201", tankNumber: "TK-201", diameterFeet: 110, product: "Crude Oil", nominalThicknessInches: NOMINAL },
  { id: "tank_tk205", clientId: "client_acme", siteId: "site_baytown", slug: "tk-205", tankNumber: "TK-205", diameterFeet: 80, product: "Diesel", nominalThicknessInches: NOMINAL },
  // Acme — Corpus Christi Yard
  { id: "tank_tk301", clientId: "client_acme", siteId: "site_corpus", slug: "tk-301", tankNumber: "TK-301", diameterFeet: 130, product: "Crude Oil", nominalThicknessInches: NOMINAL },
  { id: "tank_tk305", clientId: "client_acme", siteId: "site_corpus", slug: "tk-305", tankNumber: "TK-305", diameterFeet: 95, product: "Gasoline", nominalThicknessInches: NOMINAL },
  { id: "tank_tk309", clientId: "client_acme", siteId: "site_corpus", slug: "tk-309", tankNumber: "TK-309", diameterFeet: 105, product: "Naphtha", nominalThicknessInches: NOMINAL },
  // Other clients (inspector view only)
  { id: "tank_nw01", clientId: "client_northwind", siteId: "site_northwind_gulf", slug: "nw-01", tankNumber: "NW-01", diameterFeet: 120, product: "Crude Oil", nominalThicknessInches: NOMINAL },
  { id: "tank_nw02", clientId: "client_northwind", siteId: "site_northwind_gulf", slug: "nw-02", tankNumber: "NW-02", diameterFeet: 90, product: "Diesel", nominalThicknessInches: NOMINAL },
  { id: "tank_gs01", clientId: "client_gulfstream", siteId: "site_gulfstream_delta", slug: "gs-01", tankNumber: "GS-01", diameterFeet: 100, product: "Gasoline", nominalThicknessInches: NOMINAL },
];

const tanksById = new Map(tanks.map((t) => [t.id, t]));

// ---------------------------------------------------------------------------
// Inspection runs (+ generator params per run)
// ---------------------------------------------------------------------------
type RunConfig = {
  id: string;
  tankId: string;
  inspectedAt: string;
  status: InspectionRun["status"];
  reportStatus: InspectionRun["reportStatus"];
  gen: {
    gridN: number;
    generalLossInches: number;
    clusterDepthInches: number;
    clusterSigmaFeet: number;
  };
};

// Showcase tank uses a dense grid; other tanks use a lighter grid to keep the
// in-memory dataset fast while still driving real aggregations.
const DENSE = 32;
const LIGHT = 18;

const runConfigs: RunConfig[] = [
  // TK-104 — the showcase: 2024 monitor, 2026 action recommended (worse).
  { id: "run_tk104_2024", tankId: "tank_tk104", inspectedAt: "2024-05-12", status: "monitor", reportStatus: "ready", gen: { gridN: DENSE, generalLossInches: 0.003, clusterDepthInches: 0.05, clusterSigmaFeet: 10 } },
  { id: "run_tk104_2026", tankId: "tank_tk104", inspectedAt: "2026-06-18", status: "action_recommended", reportStatus: "ready", gen: { gridN: DENSE, generalLossInches: 0.004, clusterDepthInches: 0.105, clusterSigmaFeet: 12 } },
  // TK-101 (healthy)
  { id: "run_tk101_2024", tankId: "tank_tk101", inspectedAt: "2024-04-02", status: "healthy", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.003, clusterDepthInches: 0.015, clusterSigmaFeet: 7 } },
  { id: "run_tk101_2026", tankId: "tank_tk101", inspectedAt: "2026-03-28", status: "healthy", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.004, clusterDepthInches: 0.02, clusterSigmaFeet: 7 } },
  // TK-108 (monitor)
  { id: "run_tk108_2023", tankId: "tank_tk108", inspectedAt: "2023-09-15", status: "monitor", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.005, clusterDepthInches: 0.04, clusterSigmaFeet: 9 } },
  { id: "run_tk108_2025", tankId: "tank_tk108", inspectedAt: "2025-10-01", status: "monitor", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.007, clusterDepthInches: 0.05, clusterSigmaFeet: 9 } },
  // TK-201 (worsening to action)
  { id: "run_tk201_2024", tankId: "tank_tk201", inspectedAt: "2024-07-20", status: "monitor", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.006, clusterDepthInches: 0.05, clusterSigmaFeet: 10 } },
  { id: "run_tk201_2026", tankId: "tank_tk201", inspectedAt: "2026-02-11", status: "action_recommended", reportStatus: "draft", gen: { gridN: LIGHT, generalLossInches: 0.009, clusterDepthInches: 0.088, clusterSigmaFeet: 11 } },
  // TK-205 (single run, healthy)
  { id: "run_tk205_2025", tankId: "tank_tk205", inspectedAt: "2025-06-30", status: "healthy", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.003, clusterDepthInches: 0.015, clusterSigmaFeet: 7 } },
  // TK-301 (monitor)
  { id: "run_tk301_2024", tankId: "tank_tk301", inspectedAt: "2024-11-05", status: "monitor", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.005, clusterDepthInches: 0.045, clusterSigmaFeet: 11 } },
  { id: "run_tk301_2026", tankId: "tank_tk301", inspectedAt: "2026-01-19", status: "monitor", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.007, clusterDepthInches: 0.06, clusterSigmaFeet: 11 } },
  // TK-305 (single run, healthy)
  { id: "run_tk305_2025", tankId: "tank_tk305", inspectedAt: "2025-08-22", status: "healthy", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.003, clusterDepthInches: 0.02, clusterSigmaFeet: 8 } },
  // TK-309 (monitor)
  { id: "run_tk309_2024", tankId: "tank_tk309", inspectedAt: "2024-03-14", status: "monitor", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.006, clusterDepthInches: 0.05, clusterSigmaFeet: 10 } },
  { id: "run_tk309_2026", tankId: "tank_tk309", inspectedAt: "2026-04-30", status: "monitor", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.008, clusterDepthInches: 0.062, clusterSigmaFeet: 10 } },
  // Other clients (inspector view)
  { id: "run_nw01_2025", tankId: "tank_nw01", inspectedAt: "2025-12-02", status: "monitor", reportStatus: "ready", gen: { gridN: LIGHT, generalLossInches: 0.006, clusterDepthInches: 0.055, clusterSigmaFeet: 10 } },
  { id: "run_nw02_2026", tankId: "tank_nw02", inspectedAt: "2026-01-08", status: "healthy", reportStatus: "draft", gen: { gridN: LIGHT, generalLossInches: 0.003, clusterDepthInches: 0.015, clusterSigmaFeet: 8 } },
  { id: "run_gs01_2025", tankId: "tank_gs01", inspectedAt: "2025-11-17", status: "action_recommended", reportStatus: "draft", gen: { gridN: LIGHT, generalLossInches: 0.01, clusterDepthInches: 0.092, clusterSigmaFeet: 11 } },
];

export const inspectionRuns: InspectionRun[] = runConfigs.map((rc) => {
  const tank = tanksById.get(rc.tankId)!;
  return {
    id: rc.id,
    clientId: tank.clientId,
    siteId: tank.siteId,
    tankId: tank.id,
    inspectedAt: new Date(rc.inspectedAt).toISOString(),
    method: "PAUT robotic tank floor scan",
    status: rc.status,
    reportStatus: rc.reportStatus,
  };
});

// ---------------------------------------------------------------------------
// Measurement cells (generated deterministically per run)
// ---------------------------------------------------------------------------
export const measurementCells: MeasurementCell[] = runConfigs.flatMap((rc) => {
  const tank = tanksById.get(rc.tankId)!;
  return generateMeasurementCells({
    tank,
    inspectionRunId: rc.id,
    ...rc.gen,
  });
});

const cellsByRun = measurementCells.reduce<Record<string, MeasurementCell[]>>(
  (acc, cell) => {
    (acc[cell.inspectionRunId] ??= []).push(cell);
    return acc;
  },
  {},
);

// ---------------------------------------------------------------------------
// Findings — derived deterministically from the worst regions of a run
// ---------------------------------------------------------------------------
function severityFindingCopy(
  region: string,
  severity: Severity,
): { title: string; description: string; recommendation: string } {
  switch (severity) {
    case "critical":
      return {
        title: `Critical thinning in ${region.toLowerCase()}`,
        description: `Localized corrosion has reduced floor thickness below the critical threshold in the ${region.toLowerCase()}.`,
        recommendation: "Repair or replace affected plate and obtain engineering review before return to service.",
      };
    case "concern":
      return {
        title: `Advancing metal loss in ${region.toLowerCase()}`,
        description: `Thickness in the ${region.toLowerCase()} has entered the concern band with measurable metal loss.`,
        recommendation: "Schedule remediation and re-inspect within 12 months.",
      };
    default:
      return {
        title: `Monitor thinning in ${region.toLowerCase()}`,
        description: `Early-stage thinning observed in the ${region.toLowerCase()}; within monitoring limits.`,
        recommendation: "Continue monitoring; re-evaluate at the next inspection cycle.",
      };
  }
}

const REPORTABLE_BANDS: Severity[] = ["critical", "concern", "monitor"];

function buildFindingsForRun(runId: string): Finding[] {
  const cells = cellsByRun[runId] ?? [];
  // Region order: worst (thinnest) first, so critical annular findings lead.
  const summaries = buildRegionSummaries(cells, []).filter(
    (s) => s.severity !== "ok",
  );

  const findings: Finding[] = [];
  let n = 0;
  for (const summary of summaries) {
    const regionCells = cells.filter((c) => c.region === summary.region);
    for (const band of REPORTABLE_BANDS) {
      const bandCells = regionCells.filter((c) => c.severity === band);
      if (bandCells.length === 0) continue;
      const minThickness = Math.min(...bandCells.map((c) => c.thicknessInches));
      const maxLoss = Math.max(...bandCells.map((c) => c.metalLossPercent));
      const label = REGION_LABELS[summary.region];
      const copy = severityFindingCopy(label, band);
      n += 1;
      findings.push({
        id: `${runId}-finding-${n}`,
        inspectionRunId: runId,
        region: summary.region,
        severity: band,
        title: copy.title,
        description: `${copy.description} ${bandCells.length} reading${
          bandCells.length === 1 ? "" : "s"
        } affected; minimum ${minThickness.toFixed(3)} in (up to ${maxLoss.toFixed(
          0,
        )}% metal loss).`,
        recommendation: copy.recommendation,
      });
    }
  }
  return findings;
}

// Findings are generated for every run that has documented issues; the showcase
// run (TK-104 2026) is the richest.
export const findings: Finding[] = inspectionRuns.flatMap((run) =>
  buildFindingsForRun(run.id),
);

// ---------------------------------------------------------------------------
// Report jobs (simulated queue — production would be Redis-backed)
// ---------------------------------------------------------------------------
export const reportJobs: ReportJob[] = [
  { id: "job_1", clientId: "client_acme", inspectionRunId: "run_tk104_2026", status: "ready", requestedByUserId: "user_inspector", createdAt: "2026-06-18T15:00:00.000Z", updatedAt: "2026-06-18T15:04:00.000Z" },
  { id: "job_2", clientId: "client_acme", inspectionRunId: "run_tk201_2026", status: "processing", requestedByUserId: "user_inspector", createdAt: "2026-02-11T09:20:00.000Z", updatedAt: "2026-02-11T09:22:00.000Z" },
  { id: "job_3", clientId: "client_acme", inspectionRunId: "run_tk309_2026", status: "queued", requestedByUserId: "user_inspector", createdAt: "2026-04-30T11:00:00.000Z", updatedAt: "2026-04-30T11:00:00.000Z" },
  { id: "job_4", clientId: "client_gulfstream", inspectionRunId: "run_gs01_2025", status: "failed", requestedByUserId: "user_inspector", createdAt: "2025-11-17T16:40:00.000Z", updatedAt: "2025-11-17T16:41:00.000Z" },
];

export type SeedData = {
  clients: Client[];
  users: User[];
  sites: Site[];
  tanks: Tank[];
  inspectionRuns: InspectionRun[];
  measurementCells: MeasurementCell[];
  findings: Finding[];
  reportJobs: ReportJob[];
};

export const seedData: SeedData = {
  clients,
  users,
  sites,
  tanks,
  inspectionRuns,
  measurementCells,
  findings,
  reportJobs,
};
