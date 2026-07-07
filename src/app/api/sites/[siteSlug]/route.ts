import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/auth/session";
import { getSiteDetail, SiteNotFoundError } from "@/lib/services/site-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { siteSlug } = await params;
  try {
    const detail = await getSiteDetail(siteSlug, session.clientId);
    return NextResponse.json(detail);
  } catch (e) {
    if (e instanceof SiteNotFoundError) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    throw e;
  }
}
