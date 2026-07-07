import type {
  Client,
  InspectionStatus,
  Region,
  ReportStatus,
  Severity,
  TrendPoint,
} from "@/lib/types";
import { getRepository } from "@/lib/data/repository";
import { getTankDetail, getTankSummary } from "@/lib/services/tank-service";

export type SummaryCard = {
  label: string;
  value: string | number;
  helper?: string;
};

export type ClientTankRow = {
  siteName: string;
  siteSlug: string;
  tankNumber: string;
  tankSlug: string;
  product: string;
  lastInspection: string | null;
  minThickness: number | null;
  avgThickness: number | null;
  status: InspectionStatus | null;
  reportStatus: ReportStatus | null;
};

export type LatestInspectionSummary = {
  siteName: string;
  tankNumber: string;
  tankSlug: string;
  inspectedAt: string;
  status: InspectionStatus;
} | null;

export type SeverityByTank = {
  tankNumber: string;
  tankSlug: string;
  critical: number;
  concern: number;
  monitor: number;
  ok: number;
};

export type StatusCounts = {
  healthy: number;
  monitor: number;
  action_recommended: number;
};

export type FeaturedTank = {
  tankNumber: string;
  tankSlug: string;
  tankRadiusFeet: number;
  cells: { x: number; y: number; thicknessInches: number; region: Region; severity: Severity }[];
  readings: number;
  minThickness: number;
  inspectedAt: string;
  trendData: TrendPoint[];
  currentRunId: string;
  reportReady: boolean;
  pipelineStep: number;
  criticalCells: number;
  concernCells: number;
  findingsCount: number;
  remainingLifeYears: number | null;
  minThicknessDeltaVsPrev: number | null;
};

export type FleetStats = {
  totalTanks: number;
  totalSites: number;
  openFindings: number;
  criticalZones: number;
  reportsReady: number;
  avgMinThickness: number;
};

export type ClientDashboard = {
  client: Client;
  summaryCards: SummaryCard[];
  latestInspection: LatestInspectionSummary;
  siteTankRows: ClientTankRow[];
  severityByTank: SeverityByTank[];
  statusCounts: StatusCounts;
  featured: FeaturedTank | null;
  fleet: FleetStats;
};

const OPEN_SEVERITIES: Severity[] = ["critical", "concern"];

export async function getClientDashboard(clientId: string): Promise<ClientDashboard> {
  const repo = getRepository();
  const client = await repo.getClientById(clientId);
  if (!client) throw new Error(`Client ${clientId} not found`);

  const [sites, tanks] = await Promise.all([
    repo.getSitesForClient(clientId),
    repo.getAllTanks(clientId),
  ]);
  const siteName = new Map(sites.map((s) => [s.id, s.name]));
  const siteSlug = new Map(sites.map((s) => [s.id, s.slug]));

  const summaries = await Promise.all(
    tanks.map((tank) => getTankSummary(tank, clientId)),
  );

  // Open findings across every tank's latest run.
  const openFindings = (
    await Promise.all(
      summaries.map(async ({ latestRun }) =>
        latestRun ? repo.getFindingsForRun(latestRun.id) : [],
      ),
    )
  )
    .flat()
    .filter((f) => OPEN_SEVERITIES.includes(f.severity)).length;

  const rows: ClientTankRow[] = summaries.map(({ tank, latestRun, metrics }) => ({
    siteName: siteName.get(tank.siteId) ?? "—",
    siteSlug: siteSlug.get(tank.siteId) ?? "",
    tankNumber: tank.tankNumber,
    tankSlug: tank.slug,
    product: tank.product,
    lastInspection: latestRun?.inspectedAt ?? null,
    minThickness: metrics?.minThickness ?? null,
    avgThickness: metrics?.avgThickness ?? null,
    status: latestRun?.status ?? null,
    reportStatus: latestRun?.reportStatus ?? null,
  }));
  // Surface problems first: action_recommended, then thinnest.
  rows.sort((a, b) => {
    const rank = (s: InspectionStatus | null) =>
      s === "action_recommended" ? 0 : s === "monitor" ? 1 : 2;
    return (
      rank(a.status) - rank(b.status) ||
      (a.minThickness ?? 1) - (b.minThickness ?? 1)
    );
  });

  // Latest inspection across all tanks.
  const latestSummary = summaries
    .filter((s) => s.latestRun)
    .sort(
      (a, b) =>
        new Date(b.latestRun!.inspectedAt).getTime() -
        new Date(a.latestRun!.inspectedAt).getTime(),
    )[0];
  const latestInspection: LatestInspectionSummary = latestSummary
    ? {
        siteName: siteName.get(latestSummary.tank.siteId) ?? "—",
        tankNumber: latestSummary.tank.tankNumber,
        tankSlug: latestSummary.tank.slug,
        inspectedAt: latestSummary.latestRun!.inspectedAt,
        status: latestSummary.latestRun!.status,
      }
    : null;

  const actionTanks = summaries.filter(
    (s) => s.latestRun?.status === "action_recommended",
  ).length;
  const reportsReady = summaries.filter(
    (s) => s.latestRun?.reportStatus === "ready",
  ).length;

  const summaryCards: SummaryCard[] = [
    { label: "Tanks Monitored", value: tanks.length, helper: `${sites.length} sites` },
    { label: "Action Recommended", value: actionTanks, helper: "tanks need attention" },
    { label: "Open Findings", value: openFindings, helper: "critical + concern" },
    { label: "Reports Ready", value: reportsReady, helper: "available to download" },
  ];

  // Chart data.
  const severityByTank: SeverityByTank[] = summaries
    .filter((s) => s.metrics)
    .map((s) => ({
      tankNumber: s.tank.tankNumber,
      tankSlug: s.tank.slug,
      critical: s.metrics!.criticalCells,
      concern: s.metrics!.concernCells,
      monitor: s.metrics!.monitorCells,
      ok: s.metrics!.okCells,
    }))
    // Worst first (most critical, then concern).
    .sort((a, b) => b.critical - a.critical || b.concern - a.concern);

  const statusCounts: StatusCounts = { healthy: 0, monitor: 0, action_recommended: 0 };
  for (const s of summaries) {
    if (s.latestRun) statusCounts[s.latestRun.status] += 1;
  }

  // Fleet rollups.
  const withMetrics = summaries.filter((s) => s.metrics);
  const criticalZones = withMetrics.reduce((sum, s) => sum + s.metrics!.criticalCells, 0);
  const avgMinThickness =
    withMetrics.length > 0
      ? withMetrics.reduce((sum, s) => sum + s.metrics!.minThickness, 0) / withMetrics.length
      : 0;
  const fleet: FleetStats = {
    totalTanks: tanks.length,
    totalSites: sites.length,
    openFindings,
    criticalZones,
    reportsReady,
    avgMinThickness,
  };

  // Featured tank = worst (thinnest) tank, for the hero floor-map panel.
  const worst = [...withMetrics].sort(
    (a, b) => a.metrics!.minThickness - b.metrics!.minThickness,
  )[0];
  let featured: FeaturedTank | null = null;
  if (worst) {
    const detail = await getTankDetail(worst.tank.slug, clientId);
    const trend = detail.trendData;
    const deltaVsPrev =
      trend.length >= 2
        ? trend[trend.length - 1].minThickness - trend[trend.length - 2].minThickness
        : null;
    featured = {
      tankNumber: detail.tank.tankNumber,
      tankSlug: detail.tank.slug,
      tankRadiusFeet: detail.tank.diameterFeet / 2,
      cells: detail.cells.map((c) => ({
        x: c.x,
        y: c.y,
        thicknessInches: c.thicknessInches,
        region: c.region,
        severity: c.severity,
      })),
      readings: detail.cells.length,
      minThickness: detail.metrics.minThickness,
      inspectedAt: detail.currentRun.inspectedAt,
      trendData: trend,
      currentRunId: detail.currentRun.id,
      reportReady: detail.currentRun.reportStatus === "ready",
      pipelineStep: detail.currentRun.reportStatus === "ready" ? 3 : 1,
      criticalCells: detail.metrics.criticalCells,
      concernCells: detail.metrics.concernCells,
      findingsCount: detail.findings.length,
      remainingLifeYears: detail.metrics.estimatedRemainingLifeYears,
      minThicknessDeltaVsPrev: deltaVsPrev,
    };
  }

  return {
    client,
    summaryCards,
    latestInspection,
    siteTankRows: rows,
    severityByTank,
    statusCounts,
    featured,
    fleet,
  };
}
