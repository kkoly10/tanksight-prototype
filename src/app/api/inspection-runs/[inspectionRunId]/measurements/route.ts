import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/auth/session";
import { getMeasurementPage } from "@/lib/services/inspection-service";
import type { Region, Severity } from "@/lib/types";

const REGIONS: Region[] = ["center", "north", "south", "east", "west", "annular"];
const SEVERITIES: Severity[] = ["ok", "monitor", "concern", "critical"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ inspectionRunId: string }> },
) {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { inspectionRunId } = await params;
  const url = new URL(req.url);

  const regionParam = url.searchParams.get("region");
  const severityParam = url.searchParams.get("severity");
  const region = REGIONS.includes(regionParam as Region)
    ? (regionParam as Region)
    : undefined;
  const severity = SEVERITIES.includes(severityParam as Severity)
    ? (severityParam as Severity)
    : undefined;
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 25;

  const result = await getMeasurementPage(
    inspectionRunId,
    { region, severity },
    { page, limit },
    session.clientId,
  );
  return NextResponse.json(result);
}
