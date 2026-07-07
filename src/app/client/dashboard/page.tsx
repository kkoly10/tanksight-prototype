import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard, type MetricTone } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth/session";
import {
  getClientDashboard,
  type ClientTankRow,
} from "@/lib/services/client-dashboard-service";
import { formatInches, formatShortDate } from "@/lib/domain/formatting";

export default async function ClientDashboardPage() {
  const session = await requireSession();
  const clientId = session.clientId;
  if (!clientId) redirect("/inspector/dashboard");

  const { client, summaryCards, latestInspection, siteTankRows } =
    await getClientDashboard(clientId);

  const cardTone = (label: string, value: string | number): MetricTone => {
    if (label === "Action Recommended" && Number(value) > 0) return "critical";
    if (label === "Open Findings" && Number(value) > 0) return "concern";
    return "default";
  };

  const columns: Column<ClientTankRow>[] = [
    {
      key: "site",
      header: "Site",
      render: (r) => <span className="text-slate-600">{r.siteName}</span>,
    },
    {
      key: "tank",
      header: "Tank",
      render: (r) => (
        <Link
          href={`/client/tanks/${r.tankSlug}`}
          className="font-medium text-blue-700 hover:underline"
        >
          {r.tankNumber}
        </Link>
      ),
    },
    { key: "product", header: "Product", render: (r) => r.product },
    {
      key: "last",
      header: "Last Inspection",
      render: (r) =>
        r.lastInspection ? formatShortDate(r.lastInspection) : "—",
    },
    {
      key: "min",
      header: "Min Thickness",
      align: "right",
      className: "tabular-nums",
      render: (r) => (r.minThickness !== null ? formatInches(r.minThickness) : "—"),
    },
    {
      key: "avg",
      header: "Avg Thickness",
      align: "right",
      className: "tabular-nums",
      render: (r) => (r.avgThickness !== null ? formatInches(r.avgThickness) : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (r.status ? <StatusBadge status={r.status} /> : "—"),
    },
    {
      key: "report",
      header: "Report",
      render: (r) =>
        r.reportStatus === "ready" ? (
          <Link
            href={`/client/tanks/${r.tankSlug}`}
            className="text-sm text-blue-700 hover:underline"
          >
            Open
          </Link>
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
      description="Tank floor inspection overview and report access"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            helper={card.helper}
            tone={cardTone(card.label, card.value)}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Tanks"
            description="All monitored tanks, most urgent first"
            bodyClassName="px-2 py-1"
          >
            <DataTable
              columns={columns}
              rows={siteTankRows}
              getRowKey={(r) => r.tankSlug}
            />
          </SectionCard>
        </div>

        <SectionCard title="Latest Inspection">
          {latestInspection ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {latestInspection.siteName}
                </p>
                <Link
                  href={`/client/tanks/${latestInspection.tankSlug}`}
                  className="text-lg font-semibold text-blue-700 hover:underline"
                >
                  {latestInspection.tankNumber}
                </Link>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Inspected</span>
                <span className="font-medium text-slate-800">
                  {formatShortDate(latestInspection.inspectedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={latestInspection.status} />
              </div>
              <Link
                href={`/client/tanks/${latestInspection.tankSlug}`}
                className="mt-2 block rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-800"
              >
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
