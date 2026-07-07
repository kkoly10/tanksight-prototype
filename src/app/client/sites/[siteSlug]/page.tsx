import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth/session";
import { getSiteDetail, SiteNotFoundError } from "@/lib/services/site-service";
import type { TankSummary } from "@/lib/services/tank-service";
import { formatInches, formatShortDate } from "@/lib/domain/formatting";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const session = await requireSession();
  const { siteSlug } = await params;

  let detail;
  try {
    detail = await getSiteDetail(siteSlug, session.clientId);
  } catch (e) {
    if (e instanceof SiteNotFoundError) notFound();
    throw e;
  }
  const { site, tanks } = detail;

  const columns: Column<TankSummary>[] = [
    {
      key: "tank",
      header: "Tank",
      render: (t) => (
        <Link
          href={`/client/tanks/${t.tank.slug}`}
          className="font-medium text-blue-700 hover:underline"
        >
          {t.tank.tankNumber}
        </Link>
      ),
    },
    { key: "product", header: "Product", render: (t) => t.tank.product },
    {
      key: "diameter",
      header: "Diameter",
      align: "right",
      render: (t) => `${t.tank.diameterFeet} ft`,
    },
    {
      key: "last",
      header: "Last Inspection",
      render: (t) =>
        t.latestRun ? formatShortDate(t.latestRun.inspectedAt) : "—",
    },
    {
      key: "min",
      header: "Min Thickness",
      align: "right",
      className: "tabular-nums",
      render: (t) =>
        t.metrics ? formatInches(t.metrics.minThickness) : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (t) =>
        t.latestRun ? <StatusBadge status={t.latestRun.status} /> : "—",
    },
  ];

  return (
    <AppShell
      session={session}
      contextName={session.role === "inspector" ? "All clients" : site.name}
      title={site.name}
      description={site.location}
    >
      <SectionCard
        title="Tanks"
        description={`${tanks.length} tanks at this site`}
        bodyClassName="px-2 py-1"
      >
        <DataTable
          columns={columns}
          rows={tanks}
          getRowKey={(t) => t.tank.slug}
          emptyMessage="No tanks recorded for this site."
        />
      </SectionCard>
    </AppShell>
  );
}
