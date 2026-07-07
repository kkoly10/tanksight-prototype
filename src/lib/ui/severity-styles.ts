import type { InspectionStatus, Severity } from "@/lib/types";

/**
 * Single source of truth for severity/status colors. Class strings are written
 * as literals (not composed) so Tailwind's scanner keeps them. `hex` is used by
 * the canvas heatmap and the PDF, which can't consume Tailwind classes — so a
 * severity looks identical in the badge, the heatmap, and the report.
 */
export const SEVERITY_STYLE: Record<
  Severity,
  { badge: string; dot: string; hex: string }
> = {
  ok: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    hex: "#059669",
  },
  monitor: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  concern: {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    hex: "#ea580c",
  },
  critical: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    hex: "#dc2626",
  },
};

/**
 * 5-bin thickness gradient (green -> red) for the floor map, matching the
 * classic thickness-map look. Bins are in inches against a 0.250" nominal floor.
 */
export const THICKNESS_LEGEND: { label: string; hex: string; min: number }[] = [
  { label: "≥ 0.235", hex: "#15803d", min: 0.235 },
  { label: "0.220 – 0.235", hex: "#4ade80", min: 0.22 },
  { label: "0.205 – 0.220", hex: "#f59e0b", min: 0.205 },
  { label: "0.185 – 0.205", hex: "#ea580c", min: 0.185 },
  { label: "< 0.185", hex: "#dc2626", min: 0 },
];

export function thicknessColor(thicknessInches: number): string {
  for (const bin of THICKNESS_LEGEND) {
    if (thicknessInches >= bin.min) return bin.hex;
  }
  return THICKNESS_LEGEND[THICKNESS_LEGEND.length - 1].hex;
}

export const STATUS_STYLE: Record<InspectionStatus, { badge: string; dot: string }> = {
  healthy: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  monitor: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  action_recommended: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};
