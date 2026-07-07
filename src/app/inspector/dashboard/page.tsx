import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth/session";
import {
  getInspectorDashboard,
  type RecentInspectionRow,
  type ReportQueueRow,
  type TankReviewRow,
} from "@/lib/services/inspector-dashboard-service";
import type { ReportJobStatus } from "@/lib/types";
import { formatInches, formatShortDate } from "@/lib/domain/formatting";

const JOB_BADGE: Record<ReportJobStatus, string> = {
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  queued: "bg-slate-100 text-slate-600 border-slate-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const PRODUCTION_NEXT = [
  "MongoDB persistence with indexes on clientId, tankId, inspectionRunId, region, severity",
  "Real authentication, organization membership, and server-side session enforcement",
  "Redis-backed report-generation queue with object storage for generated PDFs",
  "CSV / JSON import pipeline for processed robot output",
  "Report approvals, revision history, and audit logs for downloads",
  "API 653 calculation layer with qualified engineering input",
];

export default async function InspectorDashboardPage() {
  const session = await requireSession();
  if (session.role !== "inspector") redirect("/client/dashboard");

  const { totals, recentInspections, reportQueue, tanksRequiringReview } =
    await getInspectorDashboard();

  const recentCols: Column<RecentInspectionRow>[] = [
    { key: "client", header: "Client", render: (r) => r.clientName },
    { key: "site", header: "Site", render: (r) => r.siteName },
    {
      key: "tank",
      header: "Tank",
      render: (r) => (
        <Link href={`/client/tanks/${r.tankSlug}`} className="font-medium text-blue-700 hover:underline">
          {r.tankNumber}
        </Link>
      ),
    },
    { key: "date", header: "Date", render: (r) => formatShortDate(r.inspectedAt) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const queueCols: Column<ReportQueueRow>[] = [
    { key: "client", header: "Client", render: (r) => r.clientName },
    { key: "tank", header: "Tank", render: (r) => r.tankNumber },
    {
      key: "status",
      header: "Job Status",
      render: (r) => (
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${JOB_BADGE[r.status]}`}>
          {r.status}
        </span>
      ),
    },
    { key: "created", header: "Requested", render: (r) => formatShortDate(r.createdAt) },
  ];

  const reviewCols: Column<TankReviewRow>[] = [
    { key: "client", header: "Client", render: (r) => r.clientName },
    { key: "site", header: "Site", render: (r) => r.siteName },
    {
      key: "tank",
      header: "Tank",
      render: (r) => (
        <Link href={`/client/tanks/${r.tankSlug}`} className="font-medium text-blue-700 hover:underline">
          {r.tankNumber}
        </Link>
      ),
    },
    {
      key: "min",
      header: "Min Thickness",
      align: "right",
      className: "tabular-nums",
      render: (r) => formatInches(r.minThickness),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <AppShell
      session={session}
      contextName="All clients"
      title="Inspector Console"
      description="Cross-client inspection overview and report queue"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Clients" value={totals.clients} helper="active accounts" />
        <MetricCard label="Tanks" value={totals.tanks} helper="under management" />
        <MetricCard label="Inspection Runs" value={totals.inspections} helper="all time" />
        <MetricCard
          label="Requiring Review"
          value={totals.tanksRequiringReview}
          helper="action recommended"
          tone={totals.tanksRequiringReview > 0 ? "critical" : "ok"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Recent Inspections" bodyClassName="px-2 py-1">
            <DataTable columns={recentCols} rows={recentInspections} getRowKey={(r) => r.runId} />
          </SectionCard>
        </div>
        <SectionCard title="Report Queue" description="Simulated generation pipeline" bodyClassName="px-2 py-1">
          <DataTable columns={queueCols} rows={reportQueue} getRowKey={(r) => r.jobId} />
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Tanks Requiring Review" bodyClassName="px-2 py-1">
            <DataTable
              columns={reviewCols}
              rows={tanksRequiringReview}
              getRowKey={(r) => r.tankSlug}
              emptyMessage="No tanks currently flagged for review."
            />
          </SectionCard>
        </div>
        <SectionCard title="What would be productionized next">
          <ul className="space-y-2">
            {PRODUCTION_NEXT.map((item) => (
              <li key={item} className="flex gap-2 text-xs text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
