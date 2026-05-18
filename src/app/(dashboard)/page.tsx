import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Total Leads", value: "—", change: null },
  { label: "Active Workflows", value: "—", change: null },
  { label: "Demo Sites", value: "—", change: null },
  { label: "Won This Month", value: "—", change: null },
];

const pipelineStages = [
  { name: "New", count: 0, color: "bg-slate-200" },
  { name: "Researching", count: 0, color: "bg-blue-200" },
  { name: "Qualified", count: 0, color: "bg-indigo-200" },
  { name: "Demo Ready", count: 0, color: "bg-violet-200" },
  { name: "Outreach", count: 0, color: "bg-amber-200" },
  { name: "Negotiating", count: 0, color: "bg-orange-200" },
  { name: "Won", count: 0, color: "bg-emerald-200" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Hunterman Agency operating overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
            {pipelineStages.map((stage) => (
              <div key={stage.name} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium">{stage.count}</span>
                <div
                  className={cn(stage.color, "w-full rounded-t-sm min-h-[8px]")}
                  style={{ height: `${Math.max(8, stage.count * 20)}px` }}
                />
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No activity yet. Add leads to get started.
            </p>
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
              <Badge variant="default" className="bg-emerald-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="text-sm font-medium">Content Engine</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="text-sm font-medium">Client Portal</p>
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

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
