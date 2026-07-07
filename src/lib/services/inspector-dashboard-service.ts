import type { InspectionStatus, ReportJobStatus, ReportStatus } from "@/lib/types";
import { getRepository } from "@/lib/data/repository";
import { getTankSummary } from "@/lib/services/tank-service";

export type InspectorTotals = {
  clients: number;
  tanks: number;
  inspections: number;
  tanksRequiringReview: number;
};

export type RecentInspectionRow = {
  runId: string;
  clientName: string;
  siteName: string;
  tankNumber: string;
  tankSlug: string;
  inspectedAt: string;
  status: InspectionStatus;
  reportStatus: ReportStatus;
};

export type ReportQueueRow = {
  jobId: string;
  clientName: string;
  tankNumber: string;
  inspectionRunId: string;
  status: ReportJobStatus;
  createdAt: string;
};

export type TankReviewRow = {
  clientName: string;
  siteName: string;
  tankNumber: string;
  tankSlug: string;
  minThickness: number;
  status: InspectionStatus;
};

export type InspectorDashboard = {
  totals: InspectorTotals;
  recentInspections: RecentInspectionRow[];
  reportQueue: ReportQueueRow[];
  tanksRequiringReview: TankReviewRow[];
};

export async function getInspectorDashboard(): Promise<InspectorDashboard> {
  const repo = getRepository();
  const [clients, sites, tanks, runs, jobs] = await Promise.all([
    repo.getAllClients(),
    repo.getAllSites(),
    repo.getAllTanks(),
    // All runs, newest first, gathered per tank so scoping stays consistent.
    (async () => {
      const all = await repo.getAllTanks();
      const perTank = await Promise.all(
        all.map((t) => repo.getInspectionRunsForTank(t.id)),
      );
      return perTank.flat();
    })(),
    repo.getReportJobs(),
  ]);

  const clientName = new Map(clients.map((c) => [c.id, c.name]));
  const siteName = new Map(sites.map((s) => [s.id, s.name]));
  const tankById = new Map(tanks.map((t) => [t.id, t]));

  const recentInspections: RecentInspectionRow[] = runs
    .sort(
      (a, b) =>
        new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime(),
    )
    .slice(0, 8)
    .map((run) => {
      const tank = tankById.get(run.tankId);
      return {
        runId: run.id,
        clientName: clientName.get(run.clientId) ?? "—",
        siteName: siteName.get(run.siteId) ?? "—",
        tankNumber: tank?.tankNumber ?? "—",
        tankSlug: tank?.slug ?? "",
        inspectedAt: run.inspectedAt,
        status: run.status,
        reportStatus: run.reportStatus,
      };
    });

  const reportQueue: ReportQueueRow[] = jobs.map((job) => {
    const run = runs.find((r) => r.id === job.inspectionRunId);
    const tank = run ? tankById.get(run.tankId) : undefined;
    return {
      jobId: job.id,
      clientName: clientName.get(job.clientId) ?? "—",
      tankNumber: tank?.tankNumber ?? "—",
      inspectionRunId: job.inspectionRunId,
      status: job.status,
      createdAt: job.createdAt,
    };
  });

  const summaries = await Promise.all(tanks.map((tank) => getTankSummary(tank)));
  const tanksRequiringReview: TankReviewRow[] = summaries
    .filter((s) => s.latestRun?.status === "action_recommended" && s.metrics)
    .map((s) => ({
      clientName: clientName.get(s.tank.clientId) ?? "—",
      siteName: siteName.get(s.tank.siteId) ?? "—",
      tankNumber: s.tank.tankNumber,
      tankSlug: s.tank.slug,
      minThickness: s.metrics!.minThickness,
      status: s.latestRun!.status,
    }))
    .sort((a, b) => a.minThickness - b.minThickness);

  return {
    totals: {
      clients: clients.length,
      tanks: tanks.length,
      inspections: runs.length,
      tanksRequiringReview: tanksRequiringReview.length,
    },
    recentInspections,
    reportQueue,
    tanksRequiringReview,
  };
}
