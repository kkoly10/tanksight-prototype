import type { RegionSummary } from "@/lib/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SeverityBadge } from "@/components/ui/Badge";
import { REGION_LABELS } from "@/lib/domain/region";
import { formatInches, formatPercent } from "@/lib/domain/formatting";

export function RegionBreakdownTable({ summaries }: { summaries: RegionSummary[] }) {
  const columns: Column<RegionSummary>[] = [
    {
      key: "region",
      header: "Region",
      render: (r) => (
        <span className="font-medium text-slate-800">{REGION_LABELS[r.region]}</span>
      ),
    },
    {
      key: "readings",
      header: "Readings",
      align: "right",
      className: "tabular-nums",
      render: (r) => r.readingCount,
    },
    {
      key: "min",
      header: "Min",
      align: "right",
      className: "tabular-nums",
      render: (r) => formatInches(r.minThickness, false),
    },
    {
      key: "avg",
      header: "Avg",
      align: "right",
      className: "tabular-nums",
      render: (r) => formatInches(r.avgThickness, false),
    },
    {
      key: "loss",
      header: "Max Loss",
      align: "right",
      className: "tabular-nums",
      render: (r) => formatPercent(r.maxMetalLossPercent, 0),
    },
    {
      key: "sev",
      header: "Severity",
      render: (r) => <SeverityBadge severity={r.severity} />,
    },
    {
      key: "rec",
      header: "Recommendation",
      render: (r) => <span className="text-xs text-slate-500">{r.recommendation}</span>,
    },
  ];

  return (
    <DataTable columns={columns} rows={summaries} getRowKey={(r) => r.region} />
  );
}
