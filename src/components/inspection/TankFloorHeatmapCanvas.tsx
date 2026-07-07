"use client";

import { useMemo } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";
import type { Region, Severity } from "@/lib/types";
import { SEVERITY_STYLE } from "@/lib/ui/severity-styles";

export type HeatmapCell = {
  x: number;
  y: number;
  region: Region;
  severity: Severity;
  thicknessInches: number;
  /** Optional explicit fill (e.g. thickness-bin color); defaults to severity color. */
  color?: string;
};

/**
 * Canvas (Konva) tank-floor heatmap. Each PAUT measurement is drawn as a cell
 * colored by severity; clicking a cell selects its region and dims the rest.
 * Canvas (not SVG) so hundreds-to-thousands of cells stay smooth — this is loaded
 * client-only because Konva needs a real canvas/DOM.
 */
export function TankFloorHeatmapCanvas({
  cells,
  tankRadiusFeet,
  size,
  selectedRegion,
  onSelectRegion,
}: {
  cells: HeatmapCell[];
  tankRadiusFeet: number;
  size: number;
  selectedRegion: Region | null;
  onSelectRegion: (region: Region) => void;
}) {
  const pad = 6;
  const inner = size - pad * 2;
  const scale = inner / (2 * tankRadiusFeet);
  const center = size / 2;

  // Estimate cell pixel size from the grid spacing so cells tile the floor.
  const cellPx = useMemo(() => {
    const xs = Array.from(new Set(cells.map((c) => c.x))).sort((a, b) => a - b);
    if (xs.length < 2) return 8;
    const spacingFeet = (xs[xs.length - 1] - xs[0]) / (xs.length - 1);
    return spacingFeet * scale * 1.08;
  }, [cells, scale]);

  // World (feet) -> canvas pixels. Flip Y so north (+y) points up.
  const toPx = (x: number, y: number) => ({
    px: center + x * scale,
    py: center - y * scale,
  });

  const annularPx = tankRadiusFeet * 0.88 * scale;

  return (
    <Stage width={size} height={size}>
      <Layer listening={false}>
        <Circle x={center} y={center} radius={inner / 2} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} />
        <Circle x={center} y={center} radius={annularPx} stroke="#e2e8f0" strokeWidth={1} dash={[4, 4]} />
      </Layer>
      <Layer>
        {cells.map((cell, i) => {
          const { px, py } = toPx(cell.x, cell.y);
          const dimmed = selectedRegion !== null && cell.region !== selectedRegion;
          return (
            <Rect
              key={i}
              x={px - cellPx / 2}
              y={py - cellPx / 2}
              width={cellPx}
              height={cellPx}
              fill={cell.color ?? SEVERITY_STYLE[cell.severity].hex}
              opacity={dimmed ? 0.18 : 0.95}
              cornerRadius={1}
              onClick={() => onSelectRegion(cell.region)}
              onTap={() => onSelectRegion(cell.region)}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = "pointer";
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = "default";
              }}
            />
          );
        })}
      </Layer>
    </Stage>
  );
}
