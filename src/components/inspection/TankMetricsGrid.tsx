import type { InspectionMetrics } from "@/lib/types";
import { KpiCard, type KpiTone } from "@/components/dashboard/KpiCard";
import { formatInches, formatPercent, formatYears } from "@/lib/domain/formatting";

export function TankMetricsGrid({ metrics }: { metrics: InspectionMetrics }) {
  const metalLoss =
    ((metrics.nominalThickness - metrics.minThickness) / metrics.nominalThickness) * 100;

  const minTone: KpiTone =
    metrics.minThickness <= 0.19 ? "red" : metrics.minThickness <= 0.23 ? "amber" : "emerald";

  const lifeTone: KpiTone =
    metrics.estimatedRemainingLifeYears === null
      ? "slate"
      : metrics.estimatedRemainingLifeYears < 3
        ? "red"
        : metrics.estimatedRemainingLifeYears < 8
          ? "amber"
          : "emerald";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard icon="ruler" tone={minTone} label="Min Thickness" value={formatInches(metrics.minThickness)} helper={`nominal ${formatInches(metrics.nominalThickness)}`} />
      <KpiCard icon="trend" tone={minTone} label="Peak Metal Loss" value={formatPercent(metalLoss, 0)} helper="vs nominal" />
      <KpiCard icon="alert" tone={metrics.criticalCells > 0 ? "red" : "emerald"} label="Critical Readings" value={metrics.criticalCells} helper={`of ${metrics.totalCells} cells`} />
      <KpiCard icon="clock" tone={lifeTone} label="Remaining Life" value={formatYears(metrics.estimatedRemainingLifeYears)} helper="est. at current rate" />
      <KpiCard icon="gauge" tone="blue" label="Avg Thickness" value={formatInches(metrics.avgThickness)} helper={`${metrics.okCells} cells OK`} />
    </div>
  );
}
