import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/Badge";
import { TankMetricsGrid } from "@/components/inspection/TankMetricsGrid";
import { TankFloorSection } from "@/components/inspection/TankFloorSection";
import { RegionBreakdownTable } from "@/components/inspection/RegionBreakdownTable";
import { InspectionTrendChart } from "@/components/inspection/InspectionTrendChart";
import { FindingsList } from "@/components/inspection/FindingsList";
import { ReportActions } from "@/components/inspection/ReportActions";
import { requireSession } from "@/lib/auth/session";
import { getTankDetail } from "@/lib/services/tank-service";
import { ReportNotFoundError } from "@/lib/services/report-service";
import { formatDate } from "@/lib/domain/formatting";

export default async function TankDetailPage({
  params,
}: {
  params: Promise<{ tankSlug: string }>;
}) {
  const session = await requireSession();
  const { tankSlug } = await params;

  let detail;
  try {
    detail = await getTankDetail(tankSlug, session.clientId);
  } catch (e) {
    if (e instanceof ReportNotFoundError) notFound();
    throw e;
  }

  const { client, site, tank, currentRun, metrics, regionSummaries, findings, trendData, executiveSummary } =
    detail;

  const heatmapCells = detail.cells.map((c) => ({
    x: c.x,
    y: c.y,
    region: c.region,
    severity: c.severity,
    thicknessInches: c.thicknessInches,
  }));

  return (
    <AppShell
      session={session}
      contextName={client.name}
      title={`${tank.tankNumber} — ${site.name}`}
      description={`${tank.product} · ${tank.diameterFeet} ft · ${currentRun.method}`}
      actions={
        <ReportActions
          inspectionRunId={currentRun.id}
          tankSlug={tank.slug}
          reportStatus={currentRun.reportStatus}
        />
      }
    >
      <nav className="mb-4 text-xs text-slate-500">
        <Link href="/client/dashboard" className="hover:underline">
          {client.name}
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/client/sites/${site.slug}`} className="hover:underline">
          {site.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-700">{tank.tankNumber}</span>
      </nav>

      {/* Inspection header strip */}
      <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm">
        <HeaderItem label="Client" value={client.name} />
        <HeaderItem label="Site" value={site.location} />
        <HeaderItem label="Inspected" value={formatDate(currentRun.inspectedAt)} />
        <HeaderItem label="Method" value="PAUT robotic scan" />
        <div className="ml-auto">
          <StatusBadge status={currentRun.status} />
        </div>
      </div>

      <TankMetricsGrid metrics={metrics} />

      <div className="mt-6">
        <SectionCard title="Executive Summary">
          <p className="text-sm leading-relaxed text-slate-700">{executiveSummary}</p>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Tank Floor Heatmap"
          description="PAUT measurement severity by floor position — click a region for detail"
        >
          <TankFloorSection
            cells={heatmapCells}
            regionAggregates={detail.regionAggregates}
            tankRadiusFeet={tank.diameterFeet / 2}
          />
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Region Breakdown"
          description="Thickness and severity by floor region"
          bodyClassName="px-2 py-1"
        >
          <RegionBreakdownTable summaries={regionSummaries} />
        </SectionCard>
        <SectionCard
          title="Inspection Trend"
          description="Minimum and average thickness across inspection history"
        >
          <InspectionTrendChart trendData={trendData} />
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Corrosion Findings"
          description={`${findings.length} documented finding${findings.length === 1 ? "" : "s"}`}
        >
          <FindingsList findings={findings} />
        </SectionCard>
      </div>
    </AppShell>
  );
}

function HeaderItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
