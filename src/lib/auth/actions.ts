"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEMO_ACCOUNTS,
  DEMO_CLIENT_COOKIE,
  DEMO_ROLE_COOKIE,
} from "@/lib/constants/demo";
import type { UserRole } from "@/lib/types";

const WEEK_SECONDS = 60 * 60 * 24 * 7;

/**
 * Demo sign-in: set the role (and client scope) cookie, then route to the right
 * dashboard. Real auth would verify credentials and establish a server session;
 * here the role IS the session.
 */
export async function signInAs(role: UserRole) {
  const account = DEMO_ACCOUNTS[role];
  const store = await cookies();
  store.set(DEMO_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WEEK_SECONDS,
  });
  if (account.clientId) {
    store.set(DEMO_CLIENT_COOKIE, account.clientId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: WEEK_SECONDS,
    });
  } else {
    store.delete(DEMO_CLIENT_COOKIE);
  }

  redirect(role === "client" ? "/client/dashboard" : "/inspector/dashboard");
}

export async function signOut() {
  const store = await cookies();
  store.delete(DEMO_ROLE_COOKIE);
  store.delete(DEMO_CLIENT_COOKIE);
  redirect("/login");
}
