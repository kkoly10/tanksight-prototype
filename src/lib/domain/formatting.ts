import type { InspectionStatus, Severity } from "@/lib/types";

/** Format a thickness in inches to 3 decimals, e.g. 0.184 -> "0.184 in". */
export function formatInches(value: number, withUnit = true): string {
  const s = value.toFixed(3);
  return withUnit ? `${s} in` : s;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatYears(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1)} yr`;
}

/** ISO date -> "June 18, 2026". Deterministic (UTC) so server and client agree. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  ok: "OK",
  monitor: "Monitor",
  concern: "Concern",
  critical: "Critical",
};

export const STATUS_LABELS: Record<InspectionStatus, string> = {
  healthy: "Healthy",
  monitor: "Monitor",
  action_recommended: "Action Recommended",
};
