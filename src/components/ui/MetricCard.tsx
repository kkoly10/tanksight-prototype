export type MetricTone = "default" | "ok" | "monitor" | "concern" | "critical";

const TONE_ACCENT: Record<MetricTone, string> = {
  default: "text-slate-900",
  ok: "text-emerald-600",
  monitor: "text-amber-600",
  concern: "text-orange-600",
  critical: "text-red-600",
};

export function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: MetricTone;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${TONE_ACCENT[tone]}`}>
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}
