import type { RegionAggregate } from "@/lib/data/repository";
import type { Severity } from "@/lib/types";
import { REGION_LABELS } from "@/lib/domain/region";
import { formatInches, formatPercent, SEVERITY_LABELS } from "@/lib/domain/formatting";
import { SEVERITY_STYLE } from "@/lib/ui/severity-styles";

const ORDER: Severity[] = ["critical", "concern", "monitor", "ok"];

export function RegionDetailsPanel({ aggregate }: { aggregate: RegionAggregate | null }) {
  if (!aggregate) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <p className="text-sm font-medium text-slate-700">Select a region</p>
        <p className="mt-1 text-xs text-slate-500">
          Click any area of the tank floor to inspect its thickness and severity
          breakdown.
        </p>
      </div>
    );
  }

  const total = aggregate.readingCount;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Selected region</p>
      <h3 className="text-lg font-semibold text-slate-900">
        {REGION_LABELS[aggregate.region]}
      </h3>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Readings" value={String(total)} />
        <Stat label="Min thickness" value={formatInches(aggregate.minThickness)} />
        <Stat label="Avg thickness" value={formatInches(aggregate.avgThickness)} />
        <Stat label="Max metal loss" value={formatPercent(aggregate.maxMetalLossPercent, 0)} />
      </dl>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Severity distribution
        </p>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          {ORDER.map((sev) => {
            const count = aggregate.severityCounts[sev];
            if (count === 0) return null;
            return (
              <div
                key={sev}
                title={`${SEVERITY_LABELS[sev]}: ${count}`}
                style={{
                  width: `${(count / total) * 100}%`,
                  backgroundColor: SEVERITY_STYLE[sev].hex,
                }}
              />
            );
          })}
        </div>
        <ul className="mt-2 space-y-1">
          {ORDER.map((sev) => (
            <li key={sev} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_STYLE[sev].hex }}
                />
                {SEVERITY_LABELS[sev]}
              </span>
              <span className="tabular-nums text-slate-500">
                {aggregate.severityCounts[sev]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
