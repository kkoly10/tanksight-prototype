import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { DataExplorer, type RunOption } from "@/components/explorer/DataExplorer";
import { requireSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

export default async function DataExplorerPage() {
  const session = await requireSession();
  const repo = getRepository();

  // Build the run picker from the runs this session is allowed to see.
  const tanks = await repo.getAllTanks(session.clientId);
  const runOptions: RunOption[] = (
    await Promise.all(
      tanks.map(async (tank) => {
        const runs = await repo.getInspectionRunsForTank(tank.id, session.clientId);
        return runs.map((run) => ({
          id: run.id,
          label: `${tank.tankNumber} · ${new Date(run.inspectedAt).getUTCFullYear()} (PAUT)`,
        }));
      }),
    )
  ).flat();

  // Default to TK-104 2026 when visible, else the first run.
  const defaultRunId =
    runOptions.find((r) => r.id === "run_tk104_2026")?.id ??
    runOptions[0]?.id ??
    "";

  return (
    <AppShell
      session={session}
      contextName={session.role === "inspector" ? "All clients" : "Acme Energy"}
      title="Data Explorer"
      description="Browse measurement-level inspection data with filters and pagination"
    >
      <SectionCard
        title="Measurement Readings"
        description="Served from the paginated measurements API"
      >
        <DataExplorer runs={runOptions} defaultRunId={defaultRunId} />
      </SectionCard>
    </AppShell>
  );
}
