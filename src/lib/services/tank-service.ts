import type {
  InspectionMetrics,
  InspectionRun,
  MeasurementCell,
  ReportData,
  Tank,
} from "@/lib/types";
import type { RegionAggregate } from "@/lib/data/repository";
import { getRepository } from "@/lib/data/repository";
import { buildInspectionMetrics } from "@/lib/domain/inspection-metrics";
import { getReportContext, ReportNotFoundError } from "@/lib/services/report-service";

/** Lightweight per-tank rollup: latest run + its metrics (null if never inspected). */
export type TankSummary = {
  tank: Tank;
  latestRun: InspectionRun | null;
  metrics: InspectionMetrics | null;
};

export async function getTankSummary(
  tank: Tank,
  clientId?: string,
): Promise<TankSummary> {
  const repo = getRepository();
  const runs = await repo.getInspectionRunsForTank(tank.id, clientId); // desc
  const latestRun = runs[0] ?? null;
  if (!latestRun) return { tank, latestRun: null, metrics: null };

  const previousRun = runs[1] ?? null;
  const [currentCells, previousCells] = await Promise.all([
    repo.getMeasurementCellsForRun(latestRun.id),
    previousRun
      ? repo.getMeasurementCellsForRun(previousRun.id)
      : Promise.resolve<MeasurementCell[]>([]),
  ]);

  const metrics = buildInspectionMetrics(
    tank,
    latestRun,
    previousRun,
    currentCells,
    previousCells,
  );
  return { tank, latestRun, metrics };
}

/**
 * Tank detail view model: everything the showcase tank page renders. It is the
 * report data (shared with the PDF) plus the raw measurement cells needed for the
 * interactive heatmap and the region aggregates.
 */
export type TankDetail = ReportData & {
  cells: MeasurementCell[];
  regionAggregates: RegionAggregate[];
};

export async function getTankDetail(
  tankSlug: string,
  clientId?: string,
): Promise<TankDetail> {
  const repo = getRepository();
  const tank = await repo.getTankBySlug(tankSlug, clientId);
  if (!tank) throw new ReportNotFoundError(`Tank ${tankSlug} not found`);

  const latest = await repo.getLatestInspectionRunForTank(tank.id, clientId);
  if (!latest) throw new ReportNotFoundError(`No inspections for tank ${tankSlug}`);

  const [{ reportData, currentCells }, regionAggregates] = await Promise.all([
    getReportContext(latest.id, clientId),
    repo.getRegionAggregates(latest.id),
  ]);

  return { ...reportData, cells: currentCells, regionAggregates };
}
