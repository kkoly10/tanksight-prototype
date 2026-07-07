import { describe, expect, it } from "vitest";
import type { InspectionRun, MeasurementCell, Region, Tank } from "@/lib/types";
import {
  buildInspectionMetrics,
  buildRegionSummaries,
  calculateAverageThickness,
  calculateMetalLossPercent,
  calculateMinThickness,
  calculateRemainingLifeEstimate,
  countSeverity,
} from "@/lib/domain/inspection-metrics";
import { classifySeverity } from "@/lib/domain/severity";

const NOMINAL = 0.25;

/** Build a measurement cell with severity/metal-loss derived from thickness. */
function cell(
  thickness: number,
  region: Region = "center",
  overrides: Partial<MeasurementCell> = {},
): MeasurementCell {
  const metalLossPercent = calculateMetalLossPercent(thickness, NOMINAL);
  return {
    id: `c-${Math.round(thickness * 1000)}-${region}`,
    clientId: "c",
    siteId: "s",
    tankId: "t",
    inspectionRunId: "run",
    x: 0,
    y: 0,
    radius: 0,
    angle: 0,
    region,
    thicknessInches: thickness,
    nominalThicknessInches: NOMINAL,
    metalLossPercent,
    severity: classifySeverity(thickness, metalLossPercent),
    ...overrides,
  };
}

const tank: Tank = {
  id: "t",
  clientId: "c",
  siteId: "s",
  slug: "tk-1",
  tankNumber: "TK-1",
  diameterFeet: 120,
  product: "Diesel",
  nominalThicknessInches: NOMINAL,
};

function run(id: string, inspectedAt: string): InspectionRun {
  return {
    id,
    clientId: "c",
    siteId: "s",
    tankId: "t",
    inspectedAt,
    method: "PAUT robotic tank floor scan",
    status: "monitor",
    reportStatus: "ready",
  };
}

describe("basic aggregates", () => {
  const cells = [cell(0.24), cell(0.2), cell(0.18)];

  it("min / average thickness", () => {
    expect(calculateMinThickness(cells)).toBeCloseTo(0.18);
    expect(calculateAverageThickness(cells)).toBeCloseTo((0.24 + 0.2 + 0.18) / 3);
  });

  it("metal loss percent, floored at zero", () => {
    expect(calculateMetalLossPercent(0.2, 0.25)).toBeCloseTo(20);
    expect(calculateMetalLossPercent(0.26, 0.25)).toBe(0);
  });

  it("counts severity bands", () => {
    const counts = countSeverity(cells);
    expect(counts.ok).toBe(1); // 0.24
    expect(counts.concern).toBe(1); // 0.20
    expect(counts.critical).toBe(1); // 0.18
  });
});

describe("buildRegionSummaries", () => {
  it("summarizes each region and sorts worst (thinnest) first", () => {
    const cells = [
      cell(0.245, "center"),
      cell(0.243, "center"),
      cell(0.15, "annular"),
      cell(0.22, "annular"),
    ];
    const summaries = buildRegionSummaries(cells, []);
    expect(summaries[0].region).toBe("annular");
    expect(summaries[0].severity).toBe("critical");
    expect(summaries[0].minThickness).toBeCloseTo(0.15);
    expect(summaries.find((s) => s.region === "center")?.severity).toBe("ok");
  });

  it("lets a finding raise a region's severity above its cells", () => {
    const cells = [cell(0.245, "north"), cell(0.244, "north")];
    const withFinding = buildRegionSummaries(cells, [
      {
        id: "f1",
        inspectionRunId: "run",
        region: "north",
        severity: "concern",
        title: "t",
        description: "d",
        recommendation: "r",
      },
    ]);
    expect(withFinding[0].severity).toBe("concern");
  });
});

describe("calculateRemainingLifeEstimate", () => {
  it("derives corrosion rate and remaining life from two runs", () => {
    const prev = run("prev", "2024-01-01");
    const curr = run("curr", "2026-01-01"); // 2 years later
    const prevCells = [cell(0.2)];
    const currCells = [cell(0.15)]; // lost 0.05 in over 2 yr -> 0.025/yr
    const result = calculateRemainingLifeEstimate(curr, prev, currCells, prevCells);
    expect(result.corrosionRateInchesPerYear).toBeCloseTo(0.025, 3);
    // (0.15 - 0.10 retirement) / 0.025 ≈ 2.0 years (± leap-year day count).
    expect(result.estimatedRemainingLifeYears).toBeCloseTo(2.0, 2);
  });

  it("returns nulls with no previous run", () => {
    const curr = run("curr", "2026-01-01");
    const result = calculateRemainingLifeEstimate(curr, null, [cell(0.15)], []);
    expect(result.estimatedRemainingLifeYears).toBeNull();
    expect(result.corrosionRateInchesPerYear).toBeNull();
  });

  it("returns null remaining life when the floor is not corroding", () => {
    const prev = run("prev", "2024-01-01");
    const curr = run("curr", "2026-01-01");
    const result = calculateRemainingLifeEstimate(
      curr,
      prev,
      [cell(0.22)], // thicker now than before -> no loss
      [cell(0.2)],
    );
    expect(result.estimatedRemainingLifeYears).toBeNull();
  });
});

describe("buildInspectionMetrics", () => {
  it("flags action when critical cells are present", () => {
    const prev = run("prev", "2024-01-01");
    const curr = run("curr", "2026-01-01");
    const metrics = buildInspectionMetrics(
      tank,
      curr,
      prev,
      [cell(0.18, "annular"), cell(0.24, "center")],
      [cell(0.22, "annular"), cell(0.245, "center")],
    );
    expect(metrics.criticalCells).toBe(1);
    expect(metrics.totalCells).toBe(2);
    expect(metrics.recommendation.toLowerCase()).toContain("action recommended");
  });
});
