import { describe, expect, it } from "vitest";
import type { TrendPoint } from "@/lib/types";
import { compareInspectionRuns } from "@/lib/domain/trend";

const point = (year: string, min: number, avg: number, crit: number): TrendPoint => ({
  inspectedAt: `${year}-01-01`,
  minThickness: min,
  avgThickness: avg,
  criticalCells: crit,
});

describe("compareInspectionRuns", () => {
  it("reports negative deltas when the floor thins", () => {
    const cmp = compareInspectionRuns(
      point("2026", 0.15, 0.22, 30),
      point("2024", 0.2, 0.235, 5),
    );
    expect(cmp).not.toBeNull();
    expect(cmp!.minThicknessDelta).toBeCloseTo(-0.05);
    expect(cmp!.criticalCellsDelta).toBe(25);
    expect(cmp!.minThicknessPercentChange).toBeCloseTo(-25, 1);
  });

  it("returns null without a previous point", () => {
    expect(compareInspectionRuns(point("2026", 0.15, 0.22, 30), null)).toBeNull();
  });
});
