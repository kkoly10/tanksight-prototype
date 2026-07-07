import { redirect } from "next/navigation";
import { getDemoSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getDemoSession();
  if (session) {
    redirect(session.role === "client" ? "/client/dashboard" : "/inspector/dashboard");
  }
  redirect("/login");
}
