"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Region, Severity } from "@/lib/types";
import type { RegionAggregate } from "@/lib/data/repository";
import { RegionDetailsPanel } from "@/components/inspection/RegionDetailsPanel";
import type { HeatmapCell } from "@/components/inspection/TankFloorHeatmapCanvas";
import { SEVERITY_LABELS } from "@/lib/domain/formatting";
import { SEVERITY_STYLE } from "@/lib/ui/severity-styles";

// Konva needs a real canvas, so the heatmap is client-only (no SSR).
const TankFloorHeatmapCanvas = dynamic(
  () =>
    import("@/components/inspection/TankFloorHeatmapCanvas").then(
      (m) => m.TankFloorHeatmapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-square w-full max-w-[420px] items-center justify-center rounded-full border border-dashed border-slate-200 text-sm text-slate-400">
        Loading heatmap…
      </div>
    ),
  },
);

const LEGEND: Severity[] = ["ok", "monitor", "concern", "critical"];

export function TankFloorSection({
  cells,
  regionAggregates,
  tankRadiusFeet,
}: {
  cells: HeatmapCell[];
  regionAggregates: RegionAggregate[];
  tankRadiusFeet: number;
}) {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const selectedAggregate =
    regionAggregates.find((a) => a.region === selectedRegion) ?? null;

  // Size the canvas to its column (capped), so it fits phones and scales up.
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(340);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setSize(Math.max(240, Math.min(420, el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div ref={boxRef} className="flex w-full flex-col items-center">
        <TankFloorHeatmapCanvas
          cells={cells}
          tankRadiusFeet={tankRadiusFeet}
          size={size}
          selectedRegion={selectedRegion}
          onSelectRegion={(r) => setSelectedRegion((prev) => (prev === r ? null : r))}
        />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {LEGEND.map((sev) => (
            <span key={sev} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: SEVERITY_STYLE[sev].hex }}
              />
              {SEVERITY_LABELS[sev]}
            </span>
          ))}
          <span className="text-xs text-slate-400">· North is up</span>
        </div>
      </div>

      <RegionDetailsPanel aggregate={selectedAggregate} />
    </div>
  );
}
