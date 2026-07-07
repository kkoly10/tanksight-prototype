import type { Finding } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SEVERITY_ORDER } from "@/lib/domain/severity";

export function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <EmptyState
        title="No findings recorded"
        description="This inspection did not produce any documented corrosion findings."
      />
    );
  }

  const sorted = [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  return (
    <ul className="divide-y divide-slate-100">
      {sorted.map((finding) => (
        <li key={finding.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{finding.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{finding.description}</p>
              <p className="mt-1.5 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Recommendation: </span>
                {finding.recommendation}
              </p>
            </div>
            <SeverityBadge severity={finding.severity} />
          </div>
        </li>
      ))}
    </ul>
  );
}
