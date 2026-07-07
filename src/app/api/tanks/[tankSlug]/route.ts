import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/auth/session";
import { getTankDetail } from "@/lib/services/tank-service";
import { ReportNotFoundError } from "@/lib/services/report-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tankSlug: string }> },
) {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { tankSlug } = await params;
  try {
    const detail = await getTankDetail(tankSlug, session.clientId);
    // Omit the raw cells from the JSON API; the heatmap uses the measurements endpoint.
    const { cells: _cells, ...rest } = detail;
    void _cells;
    return NextResponse.json(rest);
  } catch (e) {
    if (e instanceof ReportNotFoundError) {
      return NextResponse.json({ error: "Tank not found" }, { status: 404 });
    }
    throw e;
  }
}
