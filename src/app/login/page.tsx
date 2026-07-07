import { Logo } from "@/components/layout/Logo";
import { signInAs } from "@/lib/auth/actions";
import { DEMO_ACCOUNTS } from "@/lib/constants/demo";

/** Demo access portal. Simulates role-based login without real authentication. */
export default function LoginPage() {
  const client = DEMO_ACCOUNTS.client;
  const inspector = DEMO_ACCOUNTS.inspector;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-slate-900 p-12 text-slate-300 lg:flex">
        <Logo />
        <div>
          <h1 className="text-3xl font-semibold leading-tight text-white">
            Smarter tank inspections.
            <br />
            Stronger asset integrity.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Access tank inspections, floor-thickness heatmaps, corrosion
            analytics, and client-ready API 653 reports from one secure portal.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700 px-3 py-1">
              PAUT floor heatmaps
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Region breakdowns
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Trend comparison
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              PDF reports
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          © 2026 TankSight — prototype. Processed inspection data → portal →
          heatmap → report.
        </p>
      </div>

      {/* Access panel */}
      <div className="flex items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Logo subdued />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Demo access
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a role to explore the portal. No password required — this is a
            prototype demo, not production authentication.
          </p>

          <div className="mt-6 space-y-4">
            <DemoCard
              title="Client Portal"
              email={client.email}
              roleLabel="Client"
              access={client.accessDescription}
              cta="Continue as Client"
              accent="blue"
              action={signInAs.bind(null, "client")}
            />
            <DemoCard
              title="Inspector Console"
              email={inspector.email}
              roleLabel="Inspector"
              access={inspector.accessDescription}
              cta="Continue as Inspector"
              accent="slate"
              action={signInAs.bind(null, "inspector")}
            />
          </div>

          <p className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            Prototype demo access — no production authentication enabled. In
            production this is replaced by real auth, organization membership,
            role-based permissions, and server-side session enforcement.
          </p>
        </div>
      </div>
    </div>
  );
}

function DemoCard({
  title,
  email,
  roleLabel,
  access,
  cta,
  accent,
  action,
}: {
  title: string;
  email: string;
  roleLabel: string;
  access: string;
  cta: string;
  accent: "blue" | "slate";
  action: () => void;
}) {
  const button =
    accent === "blue"
      ? "bg-blue-700 hover:bg-blue-800"
      : "bg-slate-800 hover:bg-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {roleLabel}
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-slate-500">{email}</p>
      <p className="mt-2 text-xs text-slate-500">{access}</p>
      <form action={action} className="mt-4">
        <button
          type="submit"
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${button}`}
        >
          {cta}
        </button>
      </form>
    </div>
  );
}
