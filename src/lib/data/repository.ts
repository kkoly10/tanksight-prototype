import type {
  Client,
  Finding,
  InspectionRun,
  MeasurementCell,
  Region,
  ReportJob,
  Severity,
  Site,
  Tank,
} from "@/lib/types";
import { InMemoryRepository } from "@/lib/data/in-memory-repository";
import { MongoRepository } from "@/lib/data/mongo-repository";

/**
 * Data-access boundary.
 *
 * This interface is the ONLY contract the service layer depends on. The
 * prototype ships an in-memory implementation backed by the seed collections;
 * `MongoRepository` (see mongo-repository.ts) implements the identical interface
 * against Atlas. Swapping is a one-line change in `getRepository()` — no service,
 * domain, or UI code changes.
 *
 * Client scoping rule (enforced in every method that takes `clientId`):
 *   - clientId provided  -> results are filtered to that client (portal users)
 *   - clientId omitted    -> unscoped, all clients (inspector/admin)
 *
 * Recommended MongoDB indexes (documented for the production mapping):
 *   clients:          { _id: 1 }
 *   sites:            { clientId: 1, slug: 1 }
 *   tanks:            { clientId: 1, siteId: 1, slug: 1 }
 *   inspectionRuns:   { clientId: 1, tankId: 1, inspectedAt: -1 }
 *   measurementCells: { inspectionRunId: 1, region: 1, severity: 1 }
 *                     { clientId: 1, siteId: 1, tankId: 1, inspectionRunId: 1 }
 *   findings:         { inspectionRunId: 1, severity: 1 }
 *   reportJobs:       { clientId: 1, status: 1, createdAt: -1 }
 */

export type MeasurementFilters = {
  region?: Region;
  severity?: Severity;
};

/** Per-region rollup — produced by a MongoDB $group aggregation in production. */
export type RegionAggregate = {
  region: Region;
  readingCount: number;
  minThickness: number;
  avgThickness: number;
  maxMetalLossPercent: number;
  severityCounts: Record<Severity, number>;
};

export interface Repository {
  getAllClients(): Promise<Client[]>;
  getClientById(clientId: string): Promise<Client | null>;

  getSitesForClient(clientId: string): Promise<Site[]>;
  getAllSites(clientId?: string): Promise<Site[]>;
  getSiteBySlug(siteSlug: string, clientId?: string): Promise<Site | null>;

  getTanksForSite(siteId: string, clientId?: string): Promise<Tank[]>;
  getAllTanks(clientId?: string): Promise<Tank[]>;
  getTankBySlug(tankSlug: string, clientId?: string): Promise<Tank | null>;
  getTankById(tankId: string, clientId?: string): Promise<Tank | null>;

  getInspectionRunsForTank(tankId: string, clientId?: string): Promise<InspectionRun[]>;
  getLatestInspectionRunForTank(tankId: string, clientId?: string): Promise<InspectionRun | null>;
  getInspectionRunById(inspectionRunId: string, clientId?: string): Promise<InspectionRun | null>;

  getMeasurementCellsForRun(
    inspectionRunId: string,
    filters?: MeasurementFilters,
  ): Promise<MeasurementCell[]>;

  /** Aggregation: per-region reading counts + thickness rollups for one run. */
  getRegionAggregates(inspectionRunId: string): Promise<RegionAggregate[]>;

  getFindingsForRun(inspectionRunId: string): Promise<Finding[]>;

  getReportJobs(clientId?: string): Promise<ReportJob[]>;
}

// ---------------------------------------------------------------------------
// Singleton selection.
//
// The prototype defaults to the in-memory repository. Once Atlas is wired,
// setting DATA_SOURCE=mongodb (with MONGODB_URI set) swaps in MongoRepository —
// nothing else in the app changes.
// ---------------------------------------------------------------------------
let repository: Repository | null = null;

export function getRepository(): Repository {
  if (!repository) {
    repository =
      process.env.DATA_SOURCE === "mongodb"
        ? new MongoRepository()
        : new InMemoryRepository();
  }
  return repository;
}
