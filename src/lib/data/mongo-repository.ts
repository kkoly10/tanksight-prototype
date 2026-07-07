import type { Collection, Document, Filter } from "mongodb";
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
import type {
  MeasurementFilters,
  RegionAggregate,
  Repository,
} from "@/lib/data/repository";
import { COLLECTIONS, getMongoDb } from "@/lib/data/mongo";

/**
 * MongoDB implementation of the Repository contract. Identical behavior to the
 * in-memory version, backed by Atlas. Every read projects out `_id` so callers
 * get the plain domain types. Client scoping is applied in the query filter, not
 * in application code, so it's enforced at the database.
 *
 * Run `npm run db:seed` to load the seed collections and indexes first.
 */
export class MongoRepository implements Repository {
  private async col<T extends Document>(name: string): Promise<Collection<T>> {
    const db = await getMongoDb();
    return db.collection<T>(name);
  }

  private scope<T>(clientId: string | undefined, base: Filter<T> = {}): Filter<T> {
    return clientId ? ({ ...base, clientId } as Filter<T>) : base;
  }

  async getAllClients(): Promise<Client[]> {
    const col = await this.col<Client>(COLLECTIONS.clients);
    return col.find({}, { projection: { _id: 0 } }).toArray();
  }

  async getClientById(clientId: string): Promise<Client | null> {
    const col = await this.col<Client>(COLLECTIONS.clients);
    return col.findOne({ id: clientId }, { projection: { _id: 0 } });
  }

  async getSitesForClient(clientId: string): Promise<Site[]> {
    const col = await this.col<Site>(COLLECTIONS.sites);
    return col.find({ clientId }, { projection: { _id: 0 } }).toArray();
  }

  async getAllSites(clientId?: string): Promise<Site[]> {
    const col = await this.col<Site>(COLLECTIONS.sites);
    return col.find(this.scope(clientId), { projection: { _id: 0 } }).toArray();
  }

  async getSiteBySlug(siteSlug: string, clientId?: string): Promise<Site | null> {
    const col = await this.col<Site>(COLLECTIONS.sites);
    return col.findOne(this.scope(clientId, { slug: siteSlug }), {
      projection: { _id: 0 },
    });
  }

  async getTanksForSite(siteId: string, clientId?: string): Promise<Tank[]> {
    const col = await this.col<Tank>(COLLECTIONS.tanks);
    return col
      .find(this.scope(clientId, { siteId }), { projection: { _id: 0 } })
      .toArray();
  }

  async getAllTanks(clientId?: string): Promise<Tank[]> {
    const col = await this.col<Tank>(COLLECTIONS.tanks);
    return col.find(this.scope(clientId), { projection: { _id: 0 } }).toArray();
  }

  async getTankBySlug(tankSlug: string, clientId?: string): Promise<Tank | null> {
    const col = await this.col<Tank>(COLLECTIONS.tanks);
    return col.findOne(this.scope(clientId, { slug: tankSlug }), {
      projection: { _id: 0 },
    });
  }

  async getTankById(tankId: string, clientId?: string): Promise<Tank | null> {
    const col = await this.col<Tank>(COLLECTIONS.tanks);
    return col.findOne(this.scope(clientId, { id: tankId }), {
      projection: { _id: 0 },
    });
  }

  async getInspectionRunsForTank(
    tankId: string,
    clientId?: string,
  ): Promise<InspectionRun[]> {
    const col = await this.col<InspectionRun>(COLLECTIONS.inspectionRuns);
    return col
      .find(this.scope(clientId, { tankId }), { projection: { _id: 0 } })
      .sort({ inspectedAt: -1 })
      .toArray();
  }

  async getLatestInspectionRunForTank(
    tankId: string,
    clientId?: string,
  ): Promise<InspectionRun | null> {
    const col = await this.col<InspectionRun>(COLLECTIONS.inspectionRuns);
    return col.findOne(this.scope(clientId, { tankId }), {
      projection: { _id: 0 },
      sort: { inspectedAt: -1 },
    });
  }

  async getInspectionRunById(
    inspectionRunId: string,
    clientId?: string,
  ): Promise<InspectionRun | null> {
    const col = await this.col<InspectionRun>(COLLECTIONS.inspectionRuns);
    return col.findOne(this.scope(clientId, { id: inspectionRunId }), {
      projection: { _id: 0 },
    });
  }

  async getMeasurementCellsForRun(
    inspectionRunId: string,
    filters: MeasurementFilters = {},
  ): Promise<MeasurementCell[]> {
    const col = await this.col<MeasurementCell>(COLLECTIONS.measurementCells);
    const query: Filter<MeasurementCell> = { inspectionRunId };
    if (filters.region) query.region = filters.region;
    if (filters.severity) query.severity = filters.severity;
    return col.find(query, { projection: { _id: 0 } }).toArray();
  }

  /**
   * Real MongoDB aggregation: two-stage $group (by region+severity, then by
   * region) to produce per-region reading counts, thickness rollups, and a
   * severity histogram in a single round trip. This is the query the in-memory
   * repository emulates with reduce().
   */
  async getRegionAggregates(inspectionRunId: string): Promise<RegionAggregate[]> {
    const col = await this.col<MeasurementCell>(COLLECTIONS.measurementCells);
    const rows = await col
      .aggregate<{
        _id: Region;
        readingCount: number;
        minThickness: number;
        sumThickness: number;
        maxMetalLossPercent: number;
        bands: { severity: Severity; count: number }[];
      }>([
        { $match: { inspectionRunId } },
        {
          $group: {
            _id: { region: "$region", severity: "$severity" },
            count: { $sum: 1 },
            minThickness: { $min: "$thicknessInches" },
            sumThickness: { $sum: "$thicknessInches" },
            maxMetalLoss: { $max: "$metalLossPercent" },
          },
        },
        {
          $group: {
            _id: "$_id.region",
            readingCount: { $sum: "$count" },
            minThickness: { $min: "$minThickness" },
            sumThickness: { $sum: "$sumThickness" },
            maxMetalLossPercent: { $max: "$maxMetalLoss" },
            bands: { $push: { severity: "$_id.severity", count: "$count" } },
          },
        },
        { $sort: { minThickness: 1 } },
      ])
      .toArray();

    return rows.map((row) => {
      const severityCounts: Record<Severity, number> = {
        ok: 0,
        monitor: 0,
        concern: 0,
        critical: 0,
      };
      for (const band of row.bands) severityCounts[band.severity] = band.count;
      return {
        region: row._id,
        readingCount: row.readingCount,
        minThickness: row.minThickness,
        avgThickness: row.sumThickness / row.readingCount,
        maxMetalLossPercent: row.maxMetalLossPercent,
        severityCounts,
      };
    });
  }

  async getFindingsForRun(inspectionRunId: string): Promise<Finding[]> {
    const col = await this.col<Finding>(COLLECTIONS.findings);
    return col.find({ inspectionRunId }, { projection: { _id: 0 } }).toArray();
  }

  async getReportJobs(clientId?: string): Promise<ReportJob[]> {
    const col = await this.col<ReportJob>(COLLECTIONS.reportJobs);
    return col
      .find(this.scope(clientId), { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }
}
