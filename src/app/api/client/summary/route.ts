import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/auth/session";
import { getClientDashboard } from "@/lib/services/client-dashboard-service";

export async function GET() {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!session.clientId) {
    return NextResponse.json(
      { error: "Client role required" },
      { status: 400 },
    );
  }
  const dashboard = await getClientDashboard(session.clientId);
  return NextResponse.json(dashboard);
}
