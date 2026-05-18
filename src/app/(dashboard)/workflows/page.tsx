import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const workflowStatusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  running: "bg-blue-100 text-blue-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workflows</h2>
        <p className="text-muted-foreground mt-1">
          Track automation pipeline executions
        </p>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Running", value: "0", color: "text-blue-600" },
          { label: "Completed", value: "0", color: "text-emerald-600" },
          { label: "Failed", value: "0", color: "text-red-600" },
          { label: "Queued", value: "0", color: "text-slate-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No workflows yet</p>
            <p className="text-sm mt-1">
              Workflows are created when pipeline actions run on leads
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Pipelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PipelineTemplate
            name="Full Local Growth"
            description="Research → Demo Site → Outreach → Follow-up → Close"
            steps={5}
            agents={["business-researcher", "site-generator", "outreach-writer"]}
          />
          <PipelineTemplate
            name="Demo Only"
            description="Generate a demo site for a qualified lead"
            steps={2}
            agents={["site-generator"]}
          />
          <PipelineTemplate
            name="Outreach Only"
            description="Send personalized outreach to a lead"
            steps={2}
            agents={["outreach-writer"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineTemplate({
  name,
  description,
  steps,
  agents,
}: {
  name: string;
  description: string;
  steps: number;
  agents: string[];
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <div className="flex gap-1 mt-2">
          {agents.map((agent) => (
            <Badge key={agent} variant="outline" className="text-xs">
              {agent}
            </Badge>
          ))}
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{steps} steps</p>
        <Badge className={workflowStatusColors.pending} variant="secondary">
          Ready
        </Badge>
      </div>
    </div>
  );
}
