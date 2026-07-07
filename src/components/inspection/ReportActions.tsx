import Link from "next/link";

/** Report entry points: download the PDF (API route) or open the web preview. */
export function ReportActions({
  inspectionRunId,
  tankSlug,
  reportStatus,
}: {
  inspectionRunId: string;
  tankSlug: string;
  reportStatus: "draft" | "ready";
}) {
  const ready = reportStatus === "ready";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`/api/inspection-runs/${inspectionRunId}/report`}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!ready}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
          ready ? "bg-blue-700 hover:bg-blue-800" : "pointer-events-none bg-slate-300"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        </svg>
        Download PDF
      </a>
      <Link
        href={`/client/tanks/${tankSlug}/report-preview`}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Report preview
      </Link>
      {!ready && (
        <span className="text-xs text-slate-400">Report is still in draft.</span>
      )}
    </div>
  );
}
