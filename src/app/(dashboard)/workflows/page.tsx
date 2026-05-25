import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getWorkflowsOverview, WORKFLOW_STATUSES } from "@/lib/workflows";
import { listModules } from "@/lib/modules/registry";

// Read live from Supabase on every request.
export const dynamic = "force-dynamic";

const workflowStatusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  running: "bg-blue-100 text-blue-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function WorkflowsPage() {
  const { workflows, byStatus, total, error } = await getWorkflowsOverview();
  const modules = listModules();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workflows</h2>
        <p className="text-muted-foreground mt-1">
          Track pipeline executions
        </p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-700">
              Could not load workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-red-100 p-3 text-xs text-red-800 whitespace-pre-wrap">
              {error}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Counts by status */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {WORKFLOW_STATUSES.map((s) => (
              <Card key={s}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground capitalize">{s}</p>
                  <p className="text-2xl font-bold">{byStatus[s]}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent workflows / empty state */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Recent Workflows{total > 0 ? ` (${total})` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {total === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg font-medium">No workflows yet</p>
                  <p className="text-sm mt-1">
                    Workflows are created when pipeline actions run on leads. No
                    automation is built yet — this fills in once agents run.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.slice(0, 15).map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-sm font-medium">
                          {w.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(workflowStatusColors[w.status])}
                          >
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(w.started_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(w.completed_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Available pipeline templates (from the module registry) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Pipelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No modules registered.
            </p>
          ) : (
            modules.map((m) => (
              <div key={m.id} className="p-4 border rounded-lg">
                <p className="font-medium text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {m.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.pipelines.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
