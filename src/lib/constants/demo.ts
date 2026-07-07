import type { UserRole } from "@/lib/types";

/**
 * Demo access configuration.
 *
 * The prototype simulates authentication with a signed-in-role cookie instead of
 * real auth. In production this is replaced by real authentication, organization
 * membership, role-based permissions, audit logs, and server-side session
 * enforcement. See the README "Role / client scoping" section.
 */

export const DEMO_ROLE_COOKIE = "demoRole";
export const DEMO_CLIENT_COOKIE = "demoClientId";

export type DemoAccount = {
  role: UserRole;
  userId: string;
  name: string;
  email: string;
  clientId?: string;
  accessDescription: string;
};

export const DEMO_ACCOUNTS: Record<UserRole, DemoAccount> = {
  client: {
    role: "client",
    userId: "user_client_acme",
    name: "Dana Reeves",
    email: "client@acme.example",
    clientId: "client_acme",
    accessDescription: "Acme Energy only — sites, tanks, and reports for this client.",
  },
  inspector: {
    role: "inspector",
    userId: "user_inspector",
    name: "Sam Ortiz",
    email: "inspector@tanksight.example",
    accessDescription: "All clients, sites, tanks, inspection runs, and the report queue.",
  },
};

/** The clientId a role is scoped to (undefined = unscoped inspector/admin). */
export function scopeForRole(role: UserRole): string | undefined {
  return DEMO_ACCOUNTS[role].clientId;
}
