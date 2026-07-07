"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { signOut } from "@/lib/auth/actions";

export type NavItem = { href: string; label: string; icon: IconName };
type IconName = "dashboard" | "explorer" | "report" | "tanks";

const ICONS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <path d="M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z" />
  ),
  explorer: <path d="M4 5h16M4 12h16M4 19h16" />,
  report: (
    <path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6" />
  ),
  tanks: <path d="M5 8c0-2 3-3 7-3s7 1 7 3v9c0 2-3 3-7 3s-7-1-7-3zM5 8c0 2 3 3 7 3s7-1 7-3" />,
};

export function Sidebar({
  items,
  accountName,
  roleLabel,
  contextName,
}: {
  items: NavItem[];
  accountName: string;
  roleLabel: string;
  contextName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-slate-900 text-slate-300">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <div className="mx-3 mb-3 rounded-lg bg-slate-800/70 px-3 py-2.5">
        <p className="text-sm font-medium text-white">{contextName}</p>
        <p className="text-[11px] text-slate-400">{roleLabel} view</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONS[item.icon]}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {accountName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div className="leading-tight">
            <p className="text-xs font-medium text-white">{accountName}</p>
            <p className="text-[10px] text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
