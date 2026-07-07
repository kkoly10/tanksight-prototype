import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/auth/session";
import { buildReportData, ReportNotFoundError } from "@/lib/services/report-service";
import { renderReportPdf, reportFileName } from "@/lib/pdf/render-report";

// react-pdf renders on Node (not Edge).
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ inspectionRunId: string }> },
) {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { inspectionRunId } = await params;

  try {
    const data = await buildReportData(inspectionRunId, session.clientId);
    const pdf = await renderReportPdf(data);
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${reportFileName(data.tank.tankNumber)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof ReportNotFoundError) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    // PDF generation failure — surface a clean error rather than a stack trace.
    console.error("PDF generation failed:", e);
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 },
    );
  }
}
