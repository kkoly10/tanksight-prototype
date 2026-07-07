import type {
  Client,
  InspectionStatus,
  ReportStatus,
  Severity,
} from "@/lib/types";
import { getRepository } from "@/lib/data/repository";
import { getTankSummary } from "@/lib/services/tank-service";

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

export type ClientDashboard = {
  client: Client;
  summaryCards: SummaryCard[];
  latestInspection: LatestInspectionSummary;
  siteTankRows: ClientTankRow[];
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

  return { client, summaryCards, latestInspection, siteTankRows: rows };
}
