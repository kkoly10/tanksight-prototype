import type { InspectionRun, MeasurementCell, TrendPoint } from "@/lib/types";
import {
  calculateAverageThickness,
  calculateMinThickness,
  countSeverity,
} from "@/lib/domain/inspection-metrics";

/** One trend point per inspection run, oldest first. */
export function calculateRunMetrics(
  run: InspectionRun,
  cells: MeasurementCell[],
): TrendPoint {
  return {
    inspectedAt: run.inspectedAt,
    minThickness: calculateMinThickness(cells),
    avgThickness: calculateAverageThickness(cells),
    criticalCells: countSeverity(cells).critical,
  };
}

export function buildInspectionTrendData(
  runsWithCells: Array<{ run: InspectionRun; cells: MeasurementCell[] }>,
): TrendPoint[] {
  return runsWithCells
    .map(({ run, cells }) => calculateRunMetrics(run, cells))
    .sort(
      (a, b) =>
        new Date(a.inspectedAt).getTime() - new Date(b.inspectedAt).getTime(),
    );
}

export type RunComparison = {
  minThicknessDelta: number;
  avgThicknessDelta: number;
  criticalCellsDelta: number;
  minThicknessPercentChange: number | null;
};

/** current vs previous: negative thickness delta means the floor got thinner. */
export function compareInspectionRuns(
  current: TrendPoint,
  previous: TrendPoint | null,
): RunComparison | null {
  if (!previous) return null;
  const minDelta = current.minThickness - previous.minThickness;
  return {
    minThicknessDelta: minDelta,
    avgThicknessDelta: current.avgThickness - previous.avgThickness,
    criticalCellsDelta: current.criticalCells - previous.criticalCells,
    minThicknessPercentChange:
      previous.minThickness > 0
        ? (minDelta / previous.minThickness) * 100
        : null,
  };
}
