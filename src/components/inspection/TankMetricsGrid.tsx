import type { InspectionMetrics } from "@/lib/types";
import { MetricCard, type MetricTone } from "@/components/ui/MetricCard";
import { formatInches, formatPercent, formatYears } from "@/lib/domain/formatting";

export function TankMetricsGrid({ metrics }: { metrics: InspectionMetrics }) {
  const metalLoss =
    ((metrics.nominalThickness - metrics.minThickness) / metrics.nominalThickness) *
    100;

  const minTone: MetricTone =
    metrics.minThickness <= 0.19
      ? "critical"
      : metrics.minThickness <= 0.21
        ? "concern"
        : metrics.minThickness <= 0.23
          ? "monitor"
          : "ok";

  const lifeTone: MetricTone =
    metrics.estimatedRemainingLifeYears === null
      ? "default"
      : metrics.estimatedRemainingLifeYears < 3
        ? "critical"
        : metrics.estimatedRemainingLifeYears < 8
          ? "monitor"
          : "ok";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <MetricCard
        label="Min Thickness"
        value={formatInches(metrics.minThickness)}
        helper={`nominal ${formatInches(metrics.nominalThickness)}`}
        tone={minTone}
      />
      <MetricCard
        label="Peak Metal Loss"
        value={formatPercent(metalLoss, 0)}
        helper="vs nominal"
        tone={minTone}
      />
      <MetricCard
        label="Critical Readings"
        value={metrics.criticalCells}
        helper={`of ${metrics.totalCells} cells`}
        tone={metrics.criticalCells > 0 ? "critical" : "ok"}
      />
      <MetricCard
        label="Remaining Life"
        value={formatYears(metrics.estimatedRemainingLifeYears)}
        helper="est. at current rate"
        tone={lifeTone}
      />
      <MetricCard
        label="Avg Thickness"
        value={formatInches(metrics.avgThickness)}
        helper={`${metrics.okCells} cells OK`}
      />
    </div>
  );
}
