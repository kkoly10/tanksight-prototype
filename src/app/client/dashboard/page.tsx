import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FloorThicknessMap } from "@/components/dashboard/FloorThicknessMap";
import { InspectionTrendChart } from "@/components/inspection/InspectionTrendChart";
import { SeverityByTankChart } from "@/components/dashboard/SeverityByTankChart";
import { ReportPipeline } from "@/components/dashboard/ReportPipeline";
import { SummaryList, type SummaryItem } from "@/components/dashboard/SummaryList";
import { requireSession } from "@/lib/auth/session";
import {
  getClientDashboard,
  type ClientTankRow,
} from "@/lib/services/client-dashboard-service";
import { formatInches, formatShortDate, formatYears } from "@/lib/domain/formatting";

export default async function ClientDashboardPage() {
  const session = await requireSession();
  const clientId = session.clientId;
  if (!clientId) redirect("/inspector/dashboard");

  const { client, latestInspection, siteTankRows, severityByTank, featured, fleet } =
    await getClientDashboard(clientId);

  const thicknessDelta =
    featured?.minThicknessDeltaVsPrev != null
      ? {
          delta: `${Math.abs(featured.minThicknessDeltaVsPrev).toFixed(3)} in`,
          deltaDir: featured.minThicknessDeltaVsPrev < 0 ? ("down" as const) : ("up" as const),
          deltaTone: featured.minThicknessDeltaVsPrev < 0 ? ("bad" as const) : ("good" as const),
        }
      : {};

  const findingsItems: SummaryItem[] = featured
    ? [
        { icon: "alert", tone: "red", label: "Critical corrosion areas", value: String(featured.criticalCells), sub: `in ${featured.tankNumber}` },
        { icon: "ruler", tone: "amber", label: "Min thickness found", value: formatInches(featured.minThickness, false) + " in", sub: featured.tankNumber },
        { icon: "flag", tone: "violet", label: "Corrosion findings", value: String(featured.findingsCount), sub: "documented" },
        { icon: "clock", tone: "blue", label: "Remaining life estimate", value: formatYears(featured.remainingLifeYears), sub: "at current rate" },
        { icon: "check", tone: "amber", label: "Follow-up required", value: String(fleet.criticalZones > 0 ? siteTankRows.filter((r) => r.status === "action_recommended").length : 0), sub: "tanks" },
      ]
    : [];

  const columns: Column<ClientTankRow>[] = [
    { key: "site", header: "Site", render: (r) => <span className="text-slate-600">{r.siteName}</span> },
    {
      key: "tank",
      header: "Tank",
      render: (r) => (
        <Link href={`/client/tanks/${r.tankSlug}`} className="font-medium text-blue-700 hover:underline">
          {r.tankNumber}
        </Link>
      ),
    },
    { key: "product", header: "Product", render: (r) => r.product },
    { key: "last", header: "Last Inspection", render: (r) => (r.lastInspection ? formatShortDate(r.lastInspection) : "—") },
    { key: "min", header: "Min Thickness", align: "right", className: "tabular-nums", render: (r) => (r.minThickness !== null ? formatInches(r.minThickness) : "—") },
    { key: "status", header: "Status", render: (r) => (r.status ? <StatusBadge status={r.status} /> : "—") },
    {
      key: "report",
      header: "Report",
      render: (r) =>
        r.reportStatus === "ready" ? (
          <Link href={`/client/tanks/${r.tankSlug}`} className="text-sm text-blue-700 hover:underline">Open</Link>
        ) : (
          <span className="text-xs text-slate-400">Draft</span>
        ),
    },
  ];

  return (
    <AppShell
      session={session}
      contextName={client.name}
      title={`${client.name} Dashboard`}
      description="Tank floor inspection overview and PAUT analysis"
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon="tank" tone="blue" label="Total Tanks" value={fleet.totalTanks} helper={`${fleet.totalSites} sites`} />
        <KpiCard icon="building" tone="violet" label="Active Sites" value={fleet.totalSites} helper="with inspections" />
        <KpiCard icon="flag" tone="amber" label="Open Findings" value={fleet.openFindings} helper="critical + concern" />
        <KpiCard icon="alert" tone="red" label="Critical Zones" value={fleet.criticalZones} helper="require attention" />
        <KpiCard icon="document" tone="emerald" label="Reports Ready" value={fleet.reportsReady} helper="to download" />
        <KpiCard icon="ruler" tone="blue" label="Avg Min Thickness" value={formatInches(fleet.avgMinThickness)} helper="fleet-wide" {...thicknessDelta} />
      </div>

      {/* Hero visual row */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard>
          {featured ? (
            <FloorThicknessMap
              tankNumber={featured.tankNumber}
              tankSlug={featured.tankSlug}
              cells={featured.cells}
              tankRadiusFeet={featured.tankRadiusFeet}
              readings={featured.readings}
              minThickness={featured.minThickness}
              inspectedAt={featured.inspectedAt}
            />
          ) : (
            <p className="text-sm text-slate-500">No inspection data.</p>
          )}
        </SectionCard>

        <SectionCard
          title={featured ? `Min Thickness Trend — ${featured.tankNumber}` : "Min Thickness Trend"}
          description="PAUT minimum thickness across inspections"
        >
          {featured ? (
            <InspectionTrendChart trendData={featured.trendData} />
          ) : (
            <p className="text-sm text-slate-500">No trend data.</p>
          )}
        </SectionCard>

        <SectionCard title="Corrosion Severity by Tank" description="Share of readings by severity band">
          <SeverityByTankChart data={severityByTank} />
        </SectionCard>
      </div>

      {/* Pipeline + findings row */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title="Report & Export Pipeline" description="Generate and deliver client-ready reports">
            {featured ? (
              <ReportPipeline
                currentStep={featured.pipelineStep}
                inspectionRunId={featured.currentRunId}
                tankSlug={featured.tankSlug}
                reportReady={featured.reportReady}
              />
            ) : (
              <p className="text-sm text-slate-500">No reports yet.</p>
            )}
          </SectionCard>
        </div>
        <SectionCard title="Findings Summary" description={featured ? featured.tankNumber : undefined}>
          <SummaryList items={findingsItems} />
        </SectionCard>
      </div>

      {/* Tanks table + latest inspection */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Tanks" description="All monitored tanks, most urgent first" bodyClassName="px-2 py-1">
            <DataTable columns={columns} rows={siteTankRows} getRowKey={(r) => r.tankSlug} />
          </SectionCard>
        </div>

        <SectionCard title="Latest Inspection">
          {latestInspection ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{latestInspection.siteName}</p>
                <Link href={`/client/tanks/${latestInspection.tankSlug}`} className="text-lg font-semibold text-blue-700 hover:underline">
                  {latestInspection.tankNumber}
                </Link>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Inspected</span>
                <span className="font-medium text-slate-800">{formatShortDate(latestInspection.inspectedAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={latestInspection.status} />
              </div>
              <Link href={`/client/tanks/${latestInspection.tankSlug}`} className="mt-2 block rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-800">
                View inspection detail
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No inspections yet.</p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
