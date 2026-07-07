import type { Severity } from "@/lib/types";

/**
 * PROTOTYPE THRESHOLDS ONLY.
 * These are illustrative severity bands for demonstrating the reporting pipeline.
 * They are NOT API 653-certified evaluation criteria. Real remaining-thickness
 * limits depend on tank-specific t_min calculations and qualified engineering
 * review. See the README disclaimer.
 *
 * A cell's severity is the WORST band triggered by either its absolute thickness
 * (inches) or its metal loss (percent of nominal).
 */

export const SEVERITY_THRESHOLDS = {
  critical: { thicknessInches: 0.19, metalLossPercent: 24 },
  concern: { thicknessInches: 0.21, metalLossPercent: 16 },
  monitor: { thicknessInches: 0.23, metalLossPercent: 8 },
} as const;

/** Ordered worst -> best; used for aggregating a group's overall severity. */
export const SEVERITY_ORDER: Severity[] = [
  "critical",
  "concern",
  "monitor",
  "ok",
];

export function classifySeverity(
  thicknessInches: number,
  metalLossPercent: number,
): Severity {
  const t = SEVERITY_THRESHOLDS;
  if (
    thicknessInches <= t.critical.thicknessInches ||
    metalLossPercent >= t.critical.metalLossPercent
  ) {
    return "critical";
  }
  if (
    thicknessInches <= t.concern.thicknessInches ||
    metalLossPercent >= t.concern.metalLossPercent
  ) {
    return "concern";
  }
  if (
    thicknessInches <= t.monitor.thicknessInches ||
    metalLossPercent >= t.monitor.metalLossPercent
  ) {
    return "monitor";
  }
  return "ok";
}

/** The more severe of two bands ("critical" beats "ok"). */
export function worstSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_ORDER.indexOf(a) < SEVERITY_ORDER.indexOf(b) ? a : b;
}

/** Reduce a list of severities to the single worst one (defaults to "ok"). */
export function aggregateSeverity(severities: Severity[]): Severity {
  return severities.reduce<Severity>(
    (worst, s) => worstSeverity(worst, s),
    "ok",
  );
}
