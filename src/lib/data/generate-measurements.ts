import type { MeasurementCell, Tank } from "@/lib/types";
import { assignRegion } from "@/lib/domain/region";
import {
  calculateMetalLossPercent,
} from "@/lib/domain/inspection-metrics";
import { classifySeverity } from "@/lib/domain/severity";

/**
 * Deterministic PAUT-style measurement generator.
 *
 * Everything here is seeded — no Math.random() — so the heatmap, tables, trends
 * and PDF are byte-identical on every refresh and every machine. That matters:
 * a client-facing report can't show different numbers each time you open it.
 *
 * The generator models a circular tank floor as a square grid clipped to the
 * tank radius, applies mild general thinning plus a localized corrosion cluster
 * in the north-east annular ring, and lets the caller dial the severity so a
 * later inspection year comes out worse than an earlier one.
 */

/** mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable string -> 32-bit seed so a run id always produces the same field. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type GenerateMeasurementsParams = {
  tank: Pick<Tank, "id" | "clientId" | "siteId" | "diameterFeet" | "nominalThicknessInches">;
  inspectionRunId: string;
  /** Grid resolution across the diameter; ~32 yields ~800 cells inside the circle. */
  gridN?: number;
  /** Uniform thinning applied everywhere, in inches (models general corrosion). */
  generalLossInches: number;
  /** Peak additional loss at the center of the NE cluster, in inches. */
  clusterDepthInches: number;
  /** 1-sigma radius of the corrosion cluster, in feet. */
  clusterSigmaFeet: number;
};

export function generateMeasurementCells(
  params: GenerateMeasurementsParams,
): MeasurementCell[] {
  const {
    tank,
    inspectionRunId,
    gridN = 32,
    generalLossInches,
    clusterDepthInches,
    clusterSigmaFeet,
  } = params;

  const tankRadius = tank.diameterFeet / 2;
  const nominal = tank.nominalThicknessInches;
  const rand = mulberry32(hashSeed(inspectionRunId));

  // Corrosion cluster center: north-east annular ring (angle ~45deg, near shell).
  const clusterR = tankRadius * 0.92;
  const clusterX = clusterR * Math.cos(Math.PI / 4);
  const clusterY = clusterR * Math.sin(Math.PI / 4);

  const cells: MeasurementCell[] = [];
  const step = (2 * tankRadius) / (gridN - 1);
  let index = 0;

  for (let iy = 0; iy < gridN; iy++) {
    for (let ix = 0; ix < gridN; ix++) {
      const x = -tankRadius + ix * step;
      const y = -tankRadius + iy * step;
      const radius = Math.hypot(x, y);
      // Advance the PRNG for every grid position (kept even when clipped) so the
      // sequence is independent of the clip test.
      const noise = rand() * 0.008;
      if (radius > tankRadius) continue;

      const angle = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

      // Mild radial gradient: slightly thinner toward the shell.
      const radialGradient = 0.006 * (radius / tankRadius);

      // Localized cluster loss (Gaussian falloff from the cluster center).
      const d = Math.hypot(x - clusterX, y - clusterY);
      const clusterLoss =
        clusterDepthInches * Math.exp(-(d * d) / (2 * clusterSigmaFeet * clusterSigmaFeet));

      const thickness = Math.max(
        0.08,
        nominal - generalLossInches - radialGradient - noise - clusterLoss,
      );
      const thicknessInches = Number(thickness.toFixed(3));
      const metalLossPercent = Number(
        calculateMetalLossPercent(thicknessInches, nominal).toFixed(1),
      );

      cells.push({
        id: `${inspectionRunId}-cell-${index}`,
        clientId: tank.clientId,
        siteId: tank.siteId,
        tankId: tank.id,
        inspectionRunId,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        radius: Number(radius.toFixed(2)),
        angle: Number(angle.toFixed(1)),
        region: assignRegion(radius, tankRadius, angle),
        thicknessInches,
        nominalThicknessInches: nominal,
        metalLossPercent,
        severity: classifySeverity(thicknessInches, metalLossPercent),
      });
      index++;
    }
  }

  return cells;
}
