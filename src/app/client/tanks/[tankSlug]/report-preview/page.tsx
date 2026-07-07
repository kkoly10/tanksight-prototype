import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ReportPreview } from "@/components/report/ReportPreview";
import { requireSession } from "@/lib/auth/session";
import {
  getLatestReportForTank,
  ReportNotFoundError,
} from "@/lib/services/report-service";

export default async function ReportPreviewPage({
  params,
}: {
  params: Promise<{ tankSlug: string }>;
}) {
  const session = await requireSession();
  const { tankSlug } = await params;

  let data;
  try {
    data = await getLatestReportForTank(tankSlug, session.clientId);
  } catch (e) {
    if (e instanceof ReportNotFoundError) notFound();
    throw e;
  }

  return (
    <AppShell
      session={session}
      contextName={data.client.name}
      title="Report Preview"
      description={`${data.tank.tankNumber} · ${data.reportNumber}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href={`/client/tanks/${tankSlug}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to tank
          </Link>
          <a
            href={`/api/inspection-runs/${data.currentRun.id}/report`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Download PDF
          </a>
        </div>
      }
    >
      <ReportPreview data={data} />
    </AppShell>
  );
}
