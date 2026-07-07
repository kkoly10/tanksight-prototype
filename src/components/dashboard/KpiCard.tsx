import { Icon, type IconName } from "@/components/ui/Icon";

export type KpiTone = "blue" | "emerald" | "amber" | "red" | "violet" | "slate";
export type DeltaTone = "good" | "bad" | "neutral";

const TONE_BG: Record<KpiTone, string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
};

const DELTA_COLOR: Record<DeltaTone, string> = {
  good: "text-emerald-600",
  bad: "text-red-600",
  neutral: "text-slate-500",
};

export function KpiCard({
  label,
  value,
  icon,
  tone = "blue",
  delta,
  deltaDir,
  deltaTone = "neutral",
  helper,
}: {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: KpiTone;
  delta?: string;
  deltaDir?: "up" | "down";
  deltaTone?: DeltaTone;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${TONE_BG[tone]}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        {delta && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${DELTA_COLOR[deltaTone]}`}>
            {deltaDir === "up" ? "▲" : deltaDir === "down" ? "▼" : ""} {delta}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {helper && <p className="mt-0.5 text-[11px] text-slate-400">{helper}</p>}
    </div>
  );
}
