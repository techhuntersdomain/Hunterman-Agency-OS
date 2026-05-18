import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const pipelineSteps = [
  {
    name: "Research",
    description: "Analyze business online presence, competitors, and market",
    agent: "business-researcher",
    status: "ready",
  },
  {
    name: "Demo Site",
    description: "Generate a custom demo website for the prospect",
    agent: "site-generator",
    status: "ready",
  },
  {
    name: "Outreach",
    description: "Craft and send personalized outreach messages",
    agent: "outreach-writer",
    status: "ready",
  },
  {
    name: "Follow-up",
    description: "Automated follow-up sequences based on engagement",
    agent: "outreach-writer",
    status: "planned",
  },
  {
    name: "Close",
    description: "Convert to production project and onboard client",
    agent: null,
    status: "planned",
  },
];

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Local Growth Pipeline
        </h2>
        <p className="text-muted-foreground mt-1">
          End-to-end lead generation for local businesses
        </p>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {pipelineSteps.map((step, i) => (
              <div key={step.name}>
                <div className="flex items-start gap-4 py-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status === "ready"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{step.name}</p>
                      {step.agent && (
                        <Badge variant="outline" className="text-xs">
                          {step.agent}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      step.status === "ready"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {step.status}
                  </Badge>
                </div>
                {i < pipelineSteps.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Leads in Pipeline</p>
            <p className="text-3xl font-bold mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg. Time to Close</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Business Researcher", id: "business-researcher", status: "idle" },
            { name: "Site Generator", id: "site-generator", status: "idle" },
            { name: "Outreach Writer", id: "outreach-writer", status: "idle" },
            { name: "Quality Reviewer", id: "quality-reviewer", status: "idle" },
          ].map((agent) => (
            <div key={agent.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{agent.id}</p>
              </div>
              <Badge variant="outline">{agent.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
