import { Icon, type IconName } from "@/components/ui/Icon";
import type { KpiTone } from "@/components/dashboard/KpiCard";

const TONE_BG: Record<KpiTone, string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
};

export type SummaryItem = {
  icon: IconName;
  tone: KpiTone;
  label: string;
  value: string;
  sub?: string;
};

/** Icon + label/value rows — used for the Findings Summary panel. */
export function SummaryList({ items }: { items: SummaryItem[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_BG[item.tone]}`}>
            <Icon name={item.icon} className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800">{item.label}</p>
            {item.sub && <p className="truncate text-xs text-slate-500">{item.sub}</p>}
          </div>
          <span className="text-lg font-semibold tabular-nums text-slate-900">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
