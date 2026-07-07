import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ inspectionRunId: string }> },
) {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { inspectionRunId } = await params;
  const run = await getRepository().getInspectionRunById(
    inspectionRunId,
    session.clientId,
  );
  if (!run) {
    return NextResponse.json({ error: "Inspection run not found" }, { status: 404 });
  }
  return NextResponse.json(run);
}
