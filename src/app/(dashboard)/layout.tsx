import { requireUser } from "@/lib/auth";
import { DashboardShell } from "./dashboard-shell";

/**
 * Server-side gate for every dashboard route. `requireUser()` redirects to
 * `/login` when there is no authenticated session, so no dashboard page renders
 * for an anonymous request even if the proxy is somehow bypassed.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <DashboardShell email={user.email ?? "Signed in"}>{children}</DashboardShell>
  );
}
