import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusColors, formatStatus } from "@/lib/lead-status";
import type { Lead } from "@/lib/leads";
import type {
  PipelineSummary,
  StageStatus,
  NextActionKey,
} from "@/lib/pipeline-stages";
import { RunResearchButton } from "./run-research-button";
import { CreateDemoDraftButton } from "./create-demo-draft-button";
import { CreateOutreachDraftButton } from "./create-outreach-draft-button";

const stageChip: Record<StageStatus, { label: string; className: string }> = {
  done: { label: "✓ Done", className: "bg-emerald-100 text-emerald-700" },
  approved: {
    label: "✓ Approved",
    className: "bg-emerald-100 text-emerald-700",
  },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  missing: { label: "Not started", className: "bg-slate-100 text-slate-600" },
};

function Stage({ label, status }: { label: string; status: StageStatus }) {
  const chip = stageChip[status];
  return (
    <div className="flex flex-col gap-1.5 rounded-md border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge variant="secondary" className={cn("w-fit", chip.className)}>
        {chip.label}
      </Badge>
    </div>
  );
}

/** The primary CTA for the recommended next action (null for ready/none). */
function NextActionControl({
  leadId,
  nextKey,
}: {
  leadId: string;
  nextKey: NextActionKey;
}) {
  switch (nextKey) {
    case "research":
      return <RunResearchButton leadId={leadId} />;
    case "demo":
      return <CreateDemoDraftButton leadId={leadId} />;
    case "outreach":
      return <CreateOutreachDraftButton leadId={leadId} />;
    case "approve":
      return (
        <a href="#outreach" className={cn(buttonVariants({ variant: "default" }))}>
          Go to outreach draft
        </a>
      );
    default:
      return null; // "ready" / "none" — no action to take here
  }
}

/**
 * Pipeline readiness panel for the lead detail page. Shows current status +
 * score, per-stage indicators (Research / Demo / Outreach Draft / Approval),
 * the next recommended action with a primary CTA, and the remaining pipeline
 * actions. Pure presentation over real records — no sending, no fake data.
 */
export function PipelinePanel({
  lead,
  summary,
}: {
  lead: Lead;
  summary: PipelineSummary;
}) {
  // Keep every pipeline action reachable, minus whichever is the primary CTA.
  const otherActions: Array<"research" | "demo" | "outreach"> = (
    ["research", "demo", "outreach"] as const
  ).filter((k) => k !== summary.next.key);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">Current status</span>
          <Badge variant="secondary" className={cn(statusColors[lead.status])}>
            {formatStatus(lead.status)}
          </Badge>
          <span className="ml-2 text-muted-foreground">Score</span>
          <span className="font-medium">
            {lead.score !== null ? `${lead.score}/100` : "—"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stage label="Research" status={summary.research} />
          <Stage label="Demo" status={summary.demo} />
          <Stage label="Outreach Draft" status={summary.outreach} />
          <Stage label="Approval" status={summary.approval} />
        </div>

        <div className="rounded-md border bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Next recommended action
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{summary.next.label}</p>
              <p className="text-sm text-muted-foreground">
                {summary.next.description}
              </p>
            </div>
            <NextActionControl leadId={lead.id} nextKey={summary.next.key} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Other pipeline actions
          </p>
          <div className="flex flex-wrap gap-2">
            {otherActions.map((k) => {
              if (k === "research")
                return <RunResearchButton key={k} leadId={lead.id} />;
              if (k === "demo")
                return <CreateDemoDraftButton key={k} leadId={lead.id} />;
              return <CreateOutreachDraftButton key={k} leadId={lead.id} />;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
