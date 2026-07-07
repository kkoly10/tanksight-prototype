import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import type { DemoSession } from "@/lib/auth/session";

const CLIENT_NAV: NavItem[] = [
  { href: "/client/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/client/data-explorer", label: "Data Explorer", icon: "explorer" },
];

const INSPECTOR_NAV: NavItem[] = [
  { href: "/inspector/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/client/data-explorer", label: "Data Explorer", icon: "explorer" },
];

export function AppShell({
  session,
  contextName,
  title,
  description,
  actions,
  children,
}: {
  session: DemoSession;
  contextName: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const items = session.role === "client" ? CLIENT_NAV : INSPECTOR_NAV;
  const roleLabel = session.role === "client" ? "Client Portal" : "Inspector";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        items={items}
        accountName={session.account.name}
        roleLabel={roleLabel}
        contextName={contextName}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
