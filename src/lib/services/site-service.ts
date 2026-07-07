import type { Site } from "@/lib/types";
import { getRepository } from "@/lib/data/repository";
import { getTankSummary, type TankSummary } from "@/lib/services/tank-service";

export type SiteDetail = {
  site: Site;
  tanks: TankSummary[];
};

export class SiteNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteNotFoundError";
  }
}

export async function getSiteDetail(
  siteSlug: string,
  clientId?: string,
): Promise<SiteDetail> {
  const repo = getRepository();
  const site = await repo.getSiteBySlug(siteSlug, clientId);
  if (!site) throw new SiteNotFoundError(`Site ${siteSlug} not found`);

  const tanks = await repo.getTanksForSite(site.id, clientId);
  const summaries = await Promise.all(
    tanks.map((tank) => getTankSummary(tank, clientId)),
  );
  // Worst tanks first so the site page surfaces problems at the top.
  summaries.sort(
    (a, b) => (a.metrics?.minThickness ?? 1) - (b.metrics?.minThickness ?? 1),
  );

  return { site, tanks: summaries };
}
