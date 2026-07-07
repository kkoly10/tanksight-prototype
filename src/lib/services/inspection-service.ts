import type { MeasurementCell } from "@/lib/types";
import type { MeasurementFilters } from "@/lib/data/repository";
import { getRepository } from "@/lib/data/repository";

export type MeasurementPage = {
  page: number;
  limit: number;
  total: number;
  cells: MeasurementCell[];
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 500;

/**
 * Paginated, filterable measurement cells for a run. The Data Explorer and the
 * measurements API both use this. Pagination is applied here for the prototype;
 * with MongoDB this pushes down into a `.skip().limit()` on an indexed query.
 */
export async function getMeasurementPage(
  inspectionRunId: string,
  filters: MeasurementFilters = {},
  pagination: { page?: number; limit?: number } = {},
  clientId?: string,
): Promise<MeasurementPage> {
  const repo = getRepository();

  // Scoping: confirm the run is visible to this client before returning cells.
  const run = await repo.getInspectionRunById(inspectionRunId, clientId);
  if (!run) return { page: 1, limit: DEFAULT_LIMIT, total: 0, cells: [] };

  const all = await repo.getMeasurementCellsForRun(inspectionRunId, filters);
  const limit = Math.min(Math.max(1, pagination.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
  const page = Math.max(1, pagination.page ?? 1);
  const start = (page - 1) * limit;
  const cells = all.slice(start, start + limit);

  return { page, limit, total: all.length, cells };
}
