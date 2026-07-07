import type { InspectionStatus, Severity } from "@/lib/types";
import { SEVERITY_LABELS, STATUS_LABELS } from "@/lib/domain/formatting";
import { SEVERITY_STYLE, STATUS_STYLE } from "@/lib/ui/severity-styles";

function BadgeBase({
  className,
  dot,
  children,
}: {
  className: string;
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const style = SEVERITY_STYLE[severity];
  return (
    <BadgeBase className={style.badge} dot={style.dot}>
      {SEVERITY_LABELS[severity]}
    </BadgeBase>
  );
}

export function StatusBadge({ status }: { status: InspectionStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <BadgeBase className={style.badge} dot={style.dot}>
      {STATUS_LABELS[status]}
    </BadgeBase>
  );
}
