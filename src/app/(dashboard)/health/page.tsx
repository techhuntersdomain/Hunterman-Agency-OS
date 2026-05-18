import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkSupabaseConnection } from "@/lib/supabase/admin";
import { RefreshButton } from "./refresh-button";

// Always re-test on load — never cache the diagnostics result.
export const dynamic = "force-dynamic";

type EnvRow = {
  name: string;
  present: boolean;
  /** Shown value — secrets are masked, the URL is shown in full. */
  display: string;
};

function envRows(): EnvRow[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      present: Boolean(url),
      display: url || "(not set)",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      present: Boolean(anon),
      display: anon ? "set (hidden)" : "(not set)",
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      present: Boolean(service),
      display: service ? "set (hidden)" : "(not set)",
    },
  ];
}

export default async function HealthPage() {
  const rows = envRows();
  const check = await checkSupabaseConnection();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Database Health</h2>
          <p className="text-muted-foreground mt-1">
            Supabase connection diagnostics
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Connection result */}
      <Card
        className={
          check.connected
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        }
      >
        <CardHeader>
          <CardTitle className="text-base">
            <span
              className={
                check.connected ? "text-emerald-700" : "text-red-700"
              }
            >
              {check.connected
                ? "● Connected to Supabase"
                : "● Not connected"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {check.connected ? (
            <p className="text-sm text-emerald-800">
              {check.detail} Found{" "}
              <strong>{check.leadCount}</strong> row
              {check.leadCount === 1 ? "" : "s"} in the{" "}
              <code className="rounded bg-emerald-100 px-1">leads</code> table.
            </p>
          ) : (
            <>
              <p className="text-sm text-red-700">
                The exact error returned while testing the connection:
              </p>
              <pre className="rounded-md bg-red-100 p-3 text-xs text-red-800 whitespace-pre-wrap">
                {check.detail}
              </pre>
              <p className="text-sm text-red-700">
                Fix: see <code>SUPABASE_SETUP.md</code> in the project root.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Environment variables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{row.name}</td>
                  <td className="py-2 pr-4">
                    <Badge
                      variant="secondary"
                      className={
                        row.present
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {row.present ? "set" : "missing"}
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground break-all">
                    {row.display}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-3">
            Variables are read from <code>.env.local</code>. After editing it,
            restart <code>npm run dev</code> for changes to take effect.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
