import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/auth/session";
import { getInspectorDashboard } from "@/lib/services/inspector-dashboard-service";

export async function GET() {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "inspector") {
    return NextResponse.json({ error: "Inspector role required" }, { status: 403 });
  }
  const dashboard = await getInspectorDashboard();
  return NextResponse.json(dashboard);
}
