import type { ReportData } from "@/lib/types";
import { RegionBreakdownTable } from "@/components/inspection/RegionBreakdownTable";
import { FindingsList } from "@/components/inspection/FindingsList";
import { StatusBadge } from "@/components/ui/Badge";
import { Logo } from "@/components/layout/Logo";
import {
  formatDate,
  formatInches,
  formatYears,
} from "@/lib/domain/formatting";

/**
 * Web report preview. Renders from the exact same ReportData the PDF uses, so
 * "preview" and "download" are guaranteed to show the same content.
 */
export function ReportPreview({ data }: { data: ReportData }) {
  const { client, site, tank, currentRun, previousRun, metrics, trendData } = data;
  const current = trendData.find((t) => t.inspectedAt === currentRun.inspectedAt);
  const previous = previousRun
    ? trendData.find((t) => t.inspectedAt === previousRun.inspectedAt)
    : undefined;

  return (
    <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex items-start justify-between border-b-2 border-blue-700 pb-4">
        <Logo subdued />
        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-900">
            API 653 Tank Inspection Report
          </h2>
          <p className="text-xs text-slate-500">Report No. {data.reportNumber}</p>
          <p className="text-xs text-slate-500">Generated {data.generatedAt}</p>
        </div>
      </header>

      <Section title="1. Inspection Details">
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <Detail label="Client" value={client.name} />
          <Detail label="Site" value={site.name} />
          <Detail label="Location" value={site.location} />
          <Detail label="Tank" value={tank.tankNumber} />
          <Detail label="Product" value={tank.product} />
          <Detail label="Diameter" value={`${tank.diameterFeet} ft`} />
          <Detail label="Nominal Thickness" value={formatInches(tank.nominalThicknessInches)} />
          <Detail label="Inspection Date" value={formatDate(currentRun.inspectedAt)} />
          <Detail label="Method" value="PAUT robotic tank floor scan" />
        </dl>
        <div className="mt-3">
          <StatusBadge status={currentRun.status} />
        </div>
      </Section>

      <Section title="2. Executive Summary">
        <p className="text-sm leading-relaxed text-slate-700">{data.executiveSummary}</p>
      </Section>

      <Section title="3. Thickness Summary">
        <div className="grid grid-cols-4 gap-3">
          <KeyMetric label="Min Thickness" value={formatInches(metrics.minThickness)} />
          <KeyMetric label="Avg Thickness" value={formatInches(metrics.avgThickness)} />
          <KeyMetric label="Critical Readings" value={String(metrics.criticalCells)} />
          <KeyMetric
            label="Est. Remaining Life"
            value={formatYears(metrics.estimatedRemainingLifeYears)}
          />
        </div>
      </Section>

      <Section title="4. Region Breakdown">
        <RegionBreakdownTable summaries={data.regionSummaries} />
      </Section>

      <Section title="5. Corrosion Findings">
        <FindingsList findings={data.findings} />
      </Section>

      <Section title="6. Trend Comparison">
        {previous && current ? (
          <p className="text-sm text-slate-700">
            Minimum thickness moved from {formatInches(previous.minThickness)} (
            {new Date(previousRun!.inspectedAt).getUTCFullYear()}) to{" "}
            {formatInches(current.minThickness)} (
            {new Date(currentRun.inspectedAt).getUTCFullYear()}). Critical readings
            changed from {previous.criticalCells} to {current.criticalCells}.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            No prior inspection available for trend comparison.
          </p>
        )}
      </Section>

      <Section title="7. Recommendations">
        <p className="text-sm text-slate-700">{metrics.recommendation}</p>
      </Section>

      <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Prototype uses mock processed PAUT-style data for demonstration only. This
        is not an API 653-certified engineering report.
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function KeyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="text-[11px] uppercase text-slate-400">{label}</p>
    </div>
  );
}
