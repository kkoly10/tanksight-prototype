import type { MeasurementCell, ReportData } from "@/lib/types";
import { getRepository } from "@/lib/data/repository";
import {
  buildExecutiveSummary,
  buildInspectionMetrics,
  buildRegionSummaries,
} from "@/lib/domain/inspection-metrics";
import { buildInspectionTrendData } from "@/lib/domain/trend";
import { formatShortDate } from "@/lib/domain/formatting";

/**
 * Single source of truth for report content. Both the web report preview and the
 * PDF render from `ReportData`, and both go through `buildReportData`, so the two
 * outputs can never drift apart.
 */

export class ReportNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportNotFoundError";
  }
}

function reportNumberFor(tankNumber: string, inspectedAtIso: string): string {
  const d = new Date(inspectedAtIso);
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  return `API-653-${tankNumber}-${ymd}`;
}

/**
 * Assemble a report and also return the current run's measurement cells, so
 * callers that need the raw cells (e.g. the tank heatmap) don't fetch twice.
 */
export async function getReportContext(
  inspectionRunId: string,
  clientId?: string,
): Promise<{ reportData: ReportData; currentCells: MeasurementCell[] }> {
  const repo = getRepository();

  const currentRun = await repo.getInspectionRunById(inspectionRunId, clientId);
  if (!currentRun) {
    throw new ReportNotFoundError(`Inspection run ${inspectionRunId} not found`);
  }

  const [client, site, tank] = await Promise.all([
    repo.getClientById(currentRun.clientId),
    repo.getAllSites().then((sites) => sites.find((s) => s.id === currentRun.siteId)),
    repo.getTankById(currentRun.tankId, clientId),
  ]);
  if (!client || !site || !tank) {
    throw new ReportNotFoundError(`Report context incomplete for ${inspectionRunId}`);
  }

  // All runs for the tank -> previous run + trend line.
  const runs = await repo.getInspectionRunsForTank(tank.id, clientId); // desc by date
  const currentIndex = runs.findIndex((r) => r.id === currentRun.id);
  const previousRun = runs[currentIndex + 1] ?? null;

  const [currentCells, previousCells, findings] = await Promise.all([
    repo.getMeasurementCellsForRun(currentRun.id),
    previousRun
      ? repo.getMeasurementCellsForRun(previousRun.id)
      : Promise.resolve<MeasurementCell[]>([]),
    repo.getFindingsForRun(currentRun.id),
  ]);

  const metrics = buildInspectionMetrics(
    tank,
    currentRun,
    previousRun,
    currentCells,
    previousCells,
  );
  const regionSummaries = buildRegionSummaries(currentCells, findings);
  const executiveSummary = buildExecutiveSummary(
    tank,
    currentRun,
    previousRun,
    currentCells,
    previousCells,
    findings,
  );

  // Trend across all runs for this tank.
  const runsWithCells = await Promise.all(
    runs.map(async (run) => ({
      run,
      cells:
        run.id === currentRun.id
          ? currentCells
          : run.id === previousRun?.id
            ? previousCells
            : await repo.getMeasurementCellsForRun(run.id),
    })),
  );
  const trendData = buildInspectionTrendData(runsWithCells);

  const reportData: ReportData = {
    client,
    site,
    tank,
    currentRun,
    previousRun,
    metrics,
    regionSummaries,
    findings,
    trendData,
    executiveSummary,
    reportNumber: reportNumberFor(tank.tankNumber, currentRun.inspectedAt),
    // Deterministic: the report is dated to its inspection, never Date.now().
    generatedAt: formatShortDate(currentRun.inspectedAt),
  };

  return { reportData, currentCells };
}

export async function buildReportData(
  inspectionRunId: string,
  clientId?: string,
): Promise<ReportData> {
  const { reportData } = await getReportContext(inspectionRunId, clientId);
  return reportData;
}

/** Resolve a tank's latest run, then build its report data. */
export async function getLatestReportForTank(
  tankSlug: string,
  clientId?: string,
): Promise<ReportData> {
  const repo = getRepository();
  const tank = await repo.getTankBySlug(tankSlug, clientId);
  if (!tank) throw new ReportNotFoundError(`Tank ${tankSlug} not found`);
  const latest = await repo.getLatestInspectionRunForTank(tank.id, clientId);
  if (!latest) throw new ReportNotFoundError(`No inspections for tank ${tankSlug}`);
  return buildReportData(latest.id, clientId);
}
