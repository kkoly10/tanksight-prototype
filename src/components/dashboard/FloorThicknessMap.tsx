"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Region, Severity } from "@/lib/types";
import type { HeatmapCell } from "@/components/inspection/TankFloorHeatmapCanvas";
import { THICKNESS_LEGEND, thicknessColor } from "@/lib/ui/severity-styles";
import { formatInches, formatShortDate } from "@/lib/domain/formatting";

const HeatmapCanvas = dynamic(
  () =>
    import("@/components/inspection/TankFloorHeatmapCanvas").then(
      (m) => m.TankFloorHeatmapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full max-w-[280px] animate-pulse rounded-full bg-slate-100" />
    ),
  },
);

export type FloorMapCell = {
  x: number;
  y: number;
  thicknessInches: number;
  region: Region;
  severity: Severity;
};

/** Compact, thickness-colored floor map panel for dashboards. */
export function FloorThicknessMap({
  tankNumber,
  tankSlug,
  cells,
  tankRadiusFeet,
  readings,
  minThickness,
  inspectedAt,
}: {
  tankNumber: string;
  tankSlug: string;
  cells: FloorMapCell[];
  tankRadiusFeet: number;
  readings: number;
  minThickness: number;
  inspectedAt: string;
}) {
  const colored: HeatmapCell[] = useMemo(
    () =>
      cells.map((c) => ({
        x: c.x,
        y: c.y,
        region: c.region,
        severity: c.severity,
        thicknessInches: c.thicknessInches,
        color: thicknessColor(c.thicknessInches),
      })),
    [cells],
  );

  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(240);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setSize(Math.max(180, Math.min(280, el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Tank {tankNumber} Floor Thickness Map
          </h3>
          <p className="text-xs text-slate-500">PAUT floor thickness (in)</p>
        </div>
        <Link
          href={`/client/tanks/${tankSlug}`}
          className="text-xs font-medium text-blue-700 hover:underline"
        >
          View inspection
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div ref={boxRef} className="flex w-full justify-center sm:w-auto sm:flex-1">
          <HeatmapCanvas
            cells={colored}
            tankRadiusFeet={tankRadiusFeet}
            size={size}
            selectedRegion={null}
            onSelectRegion={() => {}}
          />
        </div>

        <div className="shrink-0">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Thickness (in)
          </p>
          <ul className="space-y-1">
            {THICKNESS_LEGEND.map((bin) => (
              <li key={bin.label} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: bin.hex }} />
                {bin.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-center">
        <Stat label="Readings" value={readings.toLocaleString()} />
        <Stat label="Min Thickness" value={formatInches(minThickness, false)} />
        <Stat label="Inspected" value={formatShortDate(inspectedAt)} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
