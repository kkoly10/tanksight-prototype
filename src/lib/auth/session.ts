import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEMO_ACCOUNTS,
  DEMO_ROLE_COOKIE,
  type DemoAccount,
} from "@/lib/constants/demo";
import type { UserRole } from "@/lib/types";

export type DemoSession = {
  role: UserRole;
  /** Scoping clientId — set for client users, undefined for inspectors. */
  clientId?: string;
  account: DemoAccount;
};

/**
 * Read the demo session from cookies (server-side). Returns null when no role
 * has been selected, so pages can redirect to /login. The scoping clientId is
 * derived from the role, never trusted from the client cookie alone — a client
 * session is always pinned to its own clientId.
 */
export async function getDemoSession(): Promise<DemoSession | null> {
  const store = await cookies();
  const role = store.get(DEMO_ROLE_COOKIE)?.value as UserRole | undefined;
  if (role !== "client" && role !== "inspector") return null;

  const account = DEMO_ACCOUNTS[role];
  return {
    role,
    clientId: account.clientId,
    account,
  };
}

/** Require a signed-in demo session or redirect to /login. */
export async function requireSession(): Promise<DemoSession> {
  const session = await getDemoSession();
  if (!session) redirect("/login");
  return session;
}
