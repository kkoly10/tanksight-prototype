"use client";

import { useEffect, useState } from "react";
import type { MeasurementCell, Region, Severity } from "@/lib/types";
import type { MeasurementPage } from "@/lib/services/inspection-service";
import { SeverityBadge } from "@/components/ui/Badge";
import { REGION_LABELS } from "@/lib/domain/region";
import { formatInches, formatPercent } from "@/lib/domain/formatting";

export type RunOption = { id: string; label: string };

const REGIONS: Region[] = ["center", "north", "south", "east", "west", "annular"];
const SEVERITIES: Severity[] = ["ok", "monitor", "concern", "critical"];
const LIMIT = 15;

export function DataExplorer({
  runs,
  defaultRunId,
}: {
  runs: RunOption[];
  defaultRunId: string;
}) {
  const [runId, setRunId] = useState(defaultRunId);
  const [region, setRegion] = useState<Region | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MeasurementPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        if (region) params.set("region", region);
        if (severity) params.set("severity", severity);
        const res = await fetch(
          `/api/inspection-runs/${runId}/measurements?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        setData(await res.json());
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Could not load measurements. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [runId, region, severity, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Inspection run">
          <select
            value={runId}
            onChange={(e) => {
              setRunId(e.target.value);
              setPage(1);
            }}
            className="min-w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Region">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value as Region | "");
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {REGION_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Severity">
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value as Severity | "");
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <div className="ml-auto text-sm text-slate-500">
          {data ? `${data.total.toLocaleString()} readings` : "—"}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5">Cell ID</th>
              <th className="px-3 py-2.5">Region</th>
              <th className="px-3 py-2.5 text-right">X (ft)</th>
              <th className="px-3 py-2.5 text-right">Y (ft)</th>
              <th className="px-3 py-2.5 text-right">Radius</th>
              <th className="px-3 py-2.5 text-right">Angle°</th>
              <th className="px-3 py-2.5 text-right">Thickness</th>
              <th className="px-3 py-2.5 text-right">Metal Loss</th>
              <th className="px-3 py-2.5">Severity</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && data?.cells.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                  No readings match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              data?.cells.map((cell: MeasurementCell) => (
                <tr key={cell.id} className="border-b border-slate-100 last:border-0 tabular-nums">
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">
                    {cell.id.slice(-10)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{REGION_LABELS[cell.region]}</td>
                  <td className="px-3 py-2 text-right">{cell.x.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{cell.y.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{cell.radius.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{cell.angle.toFixed(0)}</td>
                  <td className="px-3 py-2 text-right">{formatInches(cell.thicknessInches, false)}</td>
                  <td className="px-3 py-2 text-right">{formatPercent(cell.metalLossPercent, 0)}</td>
                  <td className="px-3 py-2">
                    <SeverityBadge severity={cell.severity} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Page {data?.page ?? 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
