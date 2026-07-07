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
import { seedData } from "@/lib/data/seed";

/**
 * In-memory implementation of the Repository contract, backed by the seed
 * collections. Deliberately mirrors what the MongoDB queries will do (filter by
 * clientId, sort runs by inspectedAt desc, $group for aggregates) so behavior is
 * identical after the swap.
 */
export class InMemoryRepository implements Repository {
  private clients = seedData.clients;
  private sites = seedData.sites;
  private tanks = seedData.tanks;
  private runs = seedData.inspectionRuns;
  private cells = seedData.measurementCells;
  private findings = seedData.findings;
  private jobs = seedData.reportJobs;

  async getAllClients(): Promise<Client[]> {
    return this.clients;
  }

  async getClientById(clientId: string): Promise<Client | null> {
    return this.clients.find((c) => c.id === clientId) ?? null;
  }

  async getSitesForClient(clientId: string): Promise<Site[]> {
    return this.sites.filter((s) => s.clientId === clientId);
  }

  async getAllSites(clientId?: string): Promise<Site[]> {
    return clientId ? this.getSitesForClient(clientId) : this.sites;
  }

  async getSiteBySlug(siteSlug: string, clientId?: string): Promise<Site | null> {
    return (
      this.sites.find(
        (s) => s.slug === siteSlug && (!clientId || s.clientId === clientId),
      ) ?? null
    );
  }

  async getTanksForSite(siteId: string, clientId?: string): Promise<Tank[]> {
    return this.tanks.filter(
      (t) => t.siteId === siteId && (!clientId || t.clientId === clientId),
    );
  }

  async getAllTanks(clientId?: string): Promise<Tank[]> {
    return clientId ? this.tanks.filter((t) => t.clientId === clientId) : this.tanks;
  }

  async getTankBySlug(tankSlug: string, clientId?: string): Promise<Tank | null> {
    return (
      this.tanks.find(
        (t) => t.slug === tankSlug && (!clientId || t.clientId === clientId),
      ) ?? null
    );
  }

  async getTankById(tankId: string, clientId?: string): Promise<Tank | null> {
    return (
      this.tanks.find(
        (t) => t.id === tankId && (!clientId || t.clientId === clientId),
      ) ?? null
    );
  }

  async getInspectionRunsForTank(
    tankId: string,
    clientId?: string,
  ): Promise<InspectionRun[]> {
    return this.runs
      .filter((r) => r.tankId === tankId && (!clientId || r.clientId === clientId))
      .sort(
        (a, b) =>
          new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime(),
      );
  }

  async getLatestInspectionRunForTank(
    tankId: string,
    clientId?: string,
  ): Promise<InspectionRun | null> {
    const runs = await this.getInspectionRunsForTank(tankId, clientId);
    return runs[0] ?? null;
  }

  async getInspectionRunById(
    inspectionRunId: string,
    clientId?: string,
  ): Promise<InspectionRun | null> {
    return (
      this.runs.find(
        (r) =>
          r.id === inspectionRunId && (!clientId || r.clientId === clientId),
      ) ?? null
    );
  }

  async getMeasurementCellsForRun(
    inspectionRunId: string,
    filters: MeasurementFilters = {},
  ): Promise<MeasurementCell[]> {
    return this.cells.filter(
      (c) =>
        c.inspectionRunId === inspectionRunId &&
        (!filters.region || c.region === filters.region) &&
        (!filters.severity || c.severity === filters.severity),
    );
  }

  /**
   * In production this is a single aggregation:
   *   db.measurementCells.aggregate([
   *     { $match: { inspectionRunId } },
   *     { $group: { _id: { region: "$region", severity: "$severity" }, ... } },
   *     { $group: { _id: "$_id.region", readingCount: { $sum: ... }, ... } },
   *   ])
   */
  async getRegionAggregates(inspectionRunId: string): Promise<RegionAggregate[]> {
    const cells = await this.getMeasurementCellsForRun(inspectionRunId);
    const byRegion = new Map<Region, MeasurementCell[]>();
    for (const cell of cells) {
      const list = byRegion.get(cell.region) ?? [];
      list.push(cell);
      byRegion.set(cell.region, list);
    }

    const aggregates: RegionAggregate[] = [];
    for (const [region, regionCells] of byRegion) {
      const severityCounts: Record<Severity, number> = {
        ok: 0,
        monitor: 0,
        concern: 0,
        critical: 0,
      };
      let minThickness = Infinity;
      let sumThickness = 0;
      let maxMetalLossPercent = 0;
      for (const c of regionCells) {
        severityCounts[c.severity] += 1;
        minThickness = Math.min(minThickness, c.thicknessInches);
        sumThickness += c.thicknessInches;
        maxMetalLossPercent = Math.max(maxMetalLossPercent, c.metalLossPercent);
      }
      aggregates.push({
        region,
        readingCount: regionCells.length,
        minThickness,
        avgThickness: sumThickness / regionCells.length,
        maxMetalLossPercent,
        severityCounts,
      });
    }
    return aggregates.sort((a, b) => a.minThickness - b.minThickness);
  }

  async getFindingsForRun(inspectionRunId: string): Promise<Finding[]> {
    return this.findings.filter((f) => f.inspectionRunId === inspectionRunId);
  }

  async getReportJobs(clientId?: string): Promise<ReportJob[]> {
    return this.jobs
      .filter((j) => !clientId || j.clientId === clientId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}
