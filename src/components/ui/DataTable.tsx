import { EmptyState } from "@/components/ui/EmptyState";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
};

const ALIGN: Record<NonNullable<Column<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "No records to display.",
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title="Nothing here yet" description={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                  ALIGN[col.align ?? "left"]
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={getRowKey(row, i)}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-3 text-slate-700 ${ALIGN[col.align ?? "left"]} ${
                    col.className ?? ""
                  }`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
