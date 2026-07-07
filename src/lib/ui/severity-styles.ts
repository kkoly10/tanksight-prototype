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
