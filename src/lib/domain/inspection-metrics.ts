import type {
  Finding,
  InspectionMetrics,
  InspectionRun,
  MeasurementCell,
  Region,
  RegionSummary,
  Severity,
  Tank,
} from "@/lib/types";
import { REGION_LABELS } from "@/lib/domain/region";
import { aggregateSeverity } from "@/lib/domain/severity";
import { formatInches } from "@/lib/domain/formatting";

/**
 * PROTOTYPE minimum retirement thickness for the floor plate, in inches.
 * Real API 653 t_min is derived per tank from settlement, product, and
 * foundation criteria by a qualified engineer. Used here only to make the
 * remaining-life arithmetic dimensionally correct.
 */
export const PROTOTYPE_MIN_RETIREMENT_THICKNESS_INCHES = 0.1;

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export function calculateMinThickness(cells: MeasurementCell[]): number {
  if (cells.length === 0) return 0;
  return cells.reduce((min, c) => Math.min(min, c.thicknessInches), Infinity);
}

export function calculateAverageThickness(cells: MeasurementCell[]): number {
  if (cells.length === 0) return 0;
  const total = cells.reduce((sum, c) => sum + c.thicknessInches, 0);
  return total / cells.length;
}

export function calculateMetalLossPercent(
  thicknessInches: number,
  nominalThicknessInches: number,
): number {
  if (nominalThicknessInches <= 0) return 0;
  const loss = (1 - thicknessInches / nominalThicknessInches) * 100;
  return Math.max(0, loss);
}

export function countSeverity(cells: MeasurementCell[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    ok: 0,
    monitor: 0,
    concern: 0,
    critical: 0,
  };
  for (const cell of cells) counts[cell.severity] += 1;
  return counts;
}

export function groupCellsByRegion(
  cells: MeasurementCell[],
): Record<Region, MeasurementCell[]> {
  const groups = {
    center: [],
    north: [],
    south: [],
    east: [],
    west: [],
    annular: [],
  } as Record<Region, MeasurementCell[]>;
  for (const cell of cells) groups[cell.region].push(cell);
  return groups;
}

function recommendationForSeverity(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "Repair or replace affected plate; re-inspect before return to service.";
    case "concern":
      return "Schedule remediation and re-inspect within 12 months.";
    case "monitor":
      return "Continue monitoring; re-evaluate at next inspection cycle.";
    default:
      return "No action required.";
  }
}

export function buildRegionSummaries(
  cells: MeasurementCell[],
  findings: Finding[],
): RegionSummary[] {
  const groups = groupCellsByRegion(cells);
  const findingSeverityByRegion = findings.reduce<Record<string, Severity[]>>(
    (acc, f) => {
      (acc[f.region] ??= []).push(f.severity);
      return acc;
    },
    {},
  );

  return (Object.keys(groups) as Region[])
    .map((region) => {
      const regionCells = groups[region];
      if (regionCells.length === 0) return null;
      const cellSeverity = aggregateSeverity(regionCells.map((c) => c.severity));
      const severity = aggregateSeverity([
        cellSeverity,
        ...(findingSeverityByRegion[region] ?? []),
      ]);
      return {
        region,
        readingCount: regionCells.length,
        minThickness: calculateMinThickness(regionCells),
        avgThickness: calculateAverageThickness(regionCells),
        maxMetalLossPercent: regionCells.reduce(
          (max, c) => Math.max(max, c.metalLossPercent),
          0,
        ),
        severity,
        recommendation: recommendationForSeverity(severity),
      } satisfies RegionSummary;
    })
    .filter((s): s is RegionSummary => s !== null)
    .sort(
      (a, b) =>
        a.minThickness - b.minThickness || b.readingCount - a.readingCount,
    );
}

/**
 * Corrosion rate (in/yr) from the change in minimum thickness between two runs,
 * and remaining life until the prototype retirement thickness. Returns nulls
 * when there is no prior run or no measurable loss (rate <= 0).
 */
export function calculateRemainingLifeEstimate(
  currentRun: InspectionRun,
  previousRun: InspectionRun | null,
  currentCells: MeasurementCell[],
  previousCells: MeasurementCell[],
): { corrosionRateInchesPerYear: number | null; estimatedRemainingLifeYears: number | null } {
  if (!previousRun || previousCells.length === 0) {
    return { corrosionRateInchesPerYear: null, estimatedRemainingLifeYears: null };
  }

  const years =
    (new Date(currentRun.inspectedAt).getTime() -
      new Date(previousRun.inspectedAt).getTime()) /
    YEAR_MS;
  if (years <= 0) {
    return { corrosionRateInchesPerYear: null, estimatedRemainingLifeYears: null };
  }

  const currentMin = calculateMinThickness(currentCells);
  const previousMin = calculateMinThickness(previousCells);
  const rate = (previousMin - currentMin) / years;

  if (rate <= 0) {
    return { corrosionRateInchesPerYear: 0, estimatedRemainingLifeYears: null };
  }

  const remaining = Math.max(
    0,
    (currentMin - PROTOTYPE_MIN_RETIREMENT_THICKNESS_INCHES) / rate,
  );
  return {
    corrosionRateInchesPerYear: rate,
    estimatedRemainingLifeYears: remaining,
  };
}

function overallRecommendation(
  counts: Record<Severity, number>,
  remainingLife: number | null,
): string {
  if (counts.critical > 0) {
    return "Action recommended: critical thinning detected. Prioritize plate repair and engineering review.";
  }
  if (counts.concern > 0) {
    return "Plan remediation for areas of concern and re-inspect within 12 months.";
  }
  if (remainingLife !== null && remainingLife < 5) {
    return "Monitor closely; remaining-life estimate is short. Tighten inspection interval.";
  }
  return "Floor condition acceptable. Continue routine monitoring at standard interval.";
}

export function buildInspectionMetrics(
  tank: Tank,
  currentRun: InspectionRun,
  previousRun: InspectionRun | null,
  currentCells: MeasurementCell[],
  previousCells: MeasurementCell[],
): InspectionMetrics {
  const counts = countSeverity(currentCells);
  const { corrosionRateInchesPerYear, estimatedRemainingLifeYears } =
    calculateRemainingLifeEstimate(
      currentRun,
      previousRun,
      currentCells,
      previousCells,
    );

  return {
    minThickness: calculateMinThickness(currentCells),
    avgThickness: calculateAverageThickness(currentCells),
    nominalThickness: tank.nominalThicknessInches,
    criticalCells: counts.critical,
    concernCells: counts.concern,
    monitorCells: counts.monitor,
    okCells: counts.ok,
    totalCells: currentCells.length,
    corrosionRateInchesPerYear,
    estimatedRemainingLifeYears,
    recommendation: overallRecommendation(counts, estimatedRemainingLifeYears),
  };
}

/**
 * Human-readable executive summary paragraph, generated from the same metrics the
 * rest of the report uses so the narrative can never contradict the tables.
 */
export function buildExecutiveSummary(
  tank: Tank,
  currentRun: InspectionRun,
  previousRun: InspectionRun | null,
  currentCells: MeasurementCell[],
  previousCells: MeasurementCell[],
  findings: Finding[],
): string {
  const metrics = buildInspectionMetrics(
    tank,
    currentRun,
    previousRun,
    currentCells,
    previousCells,
  );
  const regionSummaries = buildRegionSummaries(currentCells, findings);
  const worstRegion = regionSummaries[0];
  const criticalFindings = findings.filter((f) => f.severity === "critical").length;

  const parts: string[] = [];
  parts.push(
    `A ${currentRun.method} of tank ${tank.tankNumber} recorded ${metrics.totalCells} floor measurements, ` +
      `with a minimum remaining thickness of ${formatInches(metrics.minThickness)} against a nominal ${formatInches(
        tank.nominalThicknessInches,
      )}.`,
  );

  if (worstRegion) {
    parts.push(
      `The most affected area is the ${REGION_LABELS[worstRegion.region].toLowerCase()}, ` +
        `where thickness drops to ${formatInches(worstRegion.minThickness)} ` +
        `(${worstRegion.maxMetalLossPercent.toFixed(0)}% metal loss).`,
    );
  }

  if (metrics.criticalCells > 0) {
    parts.push(
      `${metrics.criticalCells} measurement${metrics.criticalCells === 1 ? "" : "s"} fall in the critical band` +
        (criticalFindings > 0
          ? `, with ${criticalFindings} critical finding${criticalFindings === 1 ? "" : "s"} documented.`
          : "."),
    );
  }

  if (previousRun && metrics.estimatedRemainingLifeYears !== null) {
    parts.push(
      `Compared with the ${new Date(previousRun.inspectedAt).getUTCFullYear()} inspection, the trend indicates an estimated ` +
        `${metrics.estimatedRemainingLifeYears.toFixed(1)} years of remaining life at the observed corrosion rate.`,
    );
  }

  parts.push(metrics.recommendation);
  return parts.join(" ");
}
