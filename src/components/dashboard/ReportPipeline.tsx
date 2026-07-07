import Link from "next/link";

const STEPS = ["Data Validated", "Report Generated", "QA Review", "Ready for Delivery"];

/**
 * Report & export pipeline stepper. `currentStep` is the highest completed stage
 * (0-based). Mirrors the report-job lifecycle the queue would drive in production.
 */
export function ReportPipeline({
  currentStep,
  inspectionRunId,
  tankSlug,
  reportReady,
}: {
  currentStep: number;
  inspectionRunId: string;
  tankSlug: string;
  reportReady: boolean;
}) {
  return (
    <div>
      <ol className="mb-5 flex items-center">
        {STEPS.map((step, i) => {
          const done = i <= currentStep;
          return (
            <li key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="w-20 text-center text-[10px] leading-tight text-slate-500">
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < currentStep ? "bg-blue-600" : "bg-slate-200"}`} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        <a
          href={reportReady ? `/api/inspection-runs/${inspectionRunId}/report` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!reportReady}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white ${
            reportReady ? "bg-blue-700 hover:bg-blue-800" : "pointer-events-none bg-slate-300"
          }`}
        >
          Download PDF
        </a>
        <Link
          href={`/client/tanks/${tankSlug}/report-preview`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Preview report
        </Link>
        <Link
          href={`/client/data-explorer`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export data
        </Link>
      </div>
    </div>
  );
}
