"use client";

import { useState } from "react";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import { Logo } from "@/components/layout/Logo";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = session.role === "client" ? CLIENT_NAV : INSPECTOR_NAV;
  const roleLabel = session.role === "client" ? "Client Portal" : "Inspector";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          items={items}
          accountName={session.account.name}
          roleLabel={roleLabel}
          contextName={contextName}
        />
      </div>

      {/* Mobile off-canvas drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full shadow-xl">
            <Sidebar
              items={items}
              accountName={session.account.name}
              roleLabel={roleLabel}
              contextName={contextName}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Logo subdued />
        </div>

        {/* Page header */}
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8 lg:py-5">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900 lg:text-xl">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">{actions}</div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
