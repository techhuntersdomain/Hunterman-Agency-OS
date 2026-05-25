import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getLeadStats } from "@/lib/leads";
import type { LeadStatus } from "@/types/database";

// Read live counts from Supabase on every request.
export const dynamic = "force-dynamic";

const funnel: { label: string; status: LeadStatus; color: string }[] = [
  { label: "New", status: "new", color: "bg-slate-300" },
  { label: "Researching", status: "researching", color: "bg-blue-300" },
  { label: "Qualified", status: "qualified", color: "bg-indigo-300" },
  { label: "Demo Ready", status: "demo_ready", color: "bg-violet-300" },
  { label: "Outreach", status: "outreach", color: "bg-amber-300" },
  { label: "Negotiating", status: "negotiating", color: "bg-orange-300" },
  { label: "Won", status: "won", color: "bg-emerald-300" },
];

export default async function DashboardPage() {
  const stats = await getLeadStats();

  const cards = [
    { label: "Total Leads", value: stats.total },
    { label: "Qualified", value: stats.byStatus.qualified },
    { label: "Demo Ready", value: stats.byStatus.demo_ready },
    { label: "Won This Period", value: stats.byStatus.won },
  ];

  const maxFunnel = Math.max(1, ...funnel.map((f) => stats.byStatus[f.status]));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Hunterman Agency operating overview
        </p>
      </div>

      {stats.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-sm text-red-700">
              Could not load live stats: {stats.error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Local Growth Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {funnel.map((stage) => {
              const count = stats.byStatus[stage.status];
              const height = count === 0 ? 8 : Math.round((count / maxFunnel) * 96) + 8;
              return (
                <div
                  key={stage.status}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <span className="text-xs font-medium">{count}</span>
                  <div
                    className={cn(stage.color, "w-full rounded-t-sm")}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-xs text-muted-foreground text-center leading-tight">
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                No leads yet. Add leads to populate the pipeline.
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Outreach in progress</span>
                  <span className="font-medium">{stats.byStatus.outreach}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Negotiating</span>
                  <span className="font-medium">{stats.byStatus.negotiating}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Lost</span>
                  <span className="font-medium">{stats.byStatus.lost}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Dormant</span>
                  <span className="font-medium">{stats.byStatus.dormant}</span>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Local Growth Pipeline</p>
                <p className="text-xs text-muted-foreground">
                  Research → Demo → Outreach → Close
                </p>
              </div>
              <Badge variant="default" className="bg-emerald-600">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="text-sm font-medium">Content Engine</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
